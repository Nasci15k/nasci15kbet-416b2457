import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookRequest {
  action: "bet" | "win" | "refund" | "rollback";
  user_code: string;
  game_code: string;
  round_id: string;
  amount: number;
  transaction_id: string;
  secret_key?: string;
  agent_token?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: WebhookRequest = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Validate required fields
    if (!body.action || !body.user_code || !body.transaction_id) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ status: "error", msg: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API settings to validate secret key
    const { data: apiSettings, error: settingsError } = await supabase
      .from("api_settings")
      .select("secret_key, agent_token")
      .eq("provider", "playfivers")
      .single();

    if (settingsError || !apiSettings) {
      console.error("API settings not found");
      return new Response(
        JSON.stringify({ status: "error", msg: "API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Validate secret_key to prevent unauthorized transactions
    if (body.secret_key && body.secret_key !== apiSettings.secret_key) {
      console.error("Invalid secret_key provided");
      return new Response(
        JSON.stringify({ status: "error", msg: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", body.user_code)
      .single();

    if (profileError || !profile) {
      console.error("User not found:", body.user_code);
      return new Response(
        JSON.stringify({ status: "error", msg: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let newBalance = Number(profile.balance) || 0;
    const amount = Number(body.amount) || 0;

    // Validate amount
    if (amount < 0) {
      console.error("Invalid amount:", amount);
      return new Response(
        JSON.stringify({ status: "error", msg: "Invalid amount", balance: newBalance }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate transaction
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference_id", body.transaction_id)
      .single();

    if (existingTx) {
      console.log("Duplicate transaction:", body.transaction_id);
      return new Response(
        JSON.stringify({ 
          status: "success", 
          msg: "Duplicate transaction",
          balance: newBalance 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get game ID
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("external_code", body.game_code)
      .single();

    // Process transaction based on action
    if (body.action === "bet") {
      if (newBalance < amount) {
        console.log("Insufficient balance:", newBalance, "required:", amount);
        return new Response(
          JSON.stringify({ status: "error", msg: "Insufficient balance", balance: newBalance }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      newBalance -= amount;

      // Create bet transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: profile.user_id,
        type: "bet",
        amount: -amount,
        balance_before: profile.balance,
        balance_after: newBalance,
        game_id: game?.id || null,
        reference_id: body.transaction_id,
        status: "completed",
        metadata: { round_id: body.round_id, game_code: body.game_code },
      });

      if (txError) {
        console.error("Transaction insert error:", txError);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          balance: newBalance,
          total_wagered: (Number(profile.total_wagered) || 0) + amount,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
      }

    } else if (body.action === "win") {
      newBalance += amount;

      // Create win transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: profile.user_id,
        type: "win",
        amount: amount,
        balance_before: profile.balance,
        balance_after: newBalance,
        game_id: game?.id || null,
        reference_id: body.transaction_id,
        status: "completed",
        metadata: { round_id: body.round_id, game_code: body.game_code },
      });

      if (txError) {
        console.error("Transaction insert error:", txError);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          balance: newBalance,
          total_won: (Number(profile.total_won) || 0) + amount,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
      }

    } else if (body.action === "refund" || body.action === "rollback") {
      newBalance += amount;

      // Create refund transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: profile.user_id,
        type: "refund",
        amount: amount,
        balance_before: profile.balance,
        balance_after: newBalance,
        game_id: game?.id || null,
        reference_id: body.transaction_id,
        status: "completed",
        metadata: { round_id: body.round_id, game_code: body.game_code, action: body.action },
      });

      if (txError) {
        console.error("Transaction insert error:", txError);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
      }
    }

    console.log("Transaction processed:", body.action, "New balance:", newBalance);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        msg: "Transaction processed",
        balance: newBalance 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ status: "error", msg: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});