import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("S6XPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    console.log("S6XPay webhook received:", rawBody);

    // Validate signature if webhook secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("X-Webhook-Signature");
      if (signature) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhookSecret);
        const messageData = encoder.encode(rawBody);
        
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
        const expectedSignatureBytes = encodeHex(new Uint8Array(signatureBuffer));
        const expectedSignature = new TextDecoder().decode(expectedSignatureBytes);

        if (signature !== expectedSignature) {
          console.error("Invalid webhook signature");
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log("Webhook signature validated");
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, transaction_id, type, status, amount, metadata, pix_data } = payload;

    console.log(`S6XPay webhook event: ${event}, transaction: ${transaction_id}, status: ${status}`);

    // ====== PAYMENT CONFIRMED (DEPOSIT) ======
    if (event === "payment.confirmed" && type === "cash_in") {
      // Find deposit by external_id
      const { data: deposit, error: depositError } = await supabase
        .from("deposits")
        .select("*")
        .eq("external_id", transaction_id)
        .single();

      if (depositError || !deposit) {
        console.error("Deposit not found for transaction:", transaction_id);
        return new Response(
          JSON.stringify({ success: true, message: "Deposit not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (deposit.status === "completed") {
        console.log("Deposit already completed:", deposit.id);
        return new Response(
          JSON.stringify({ success: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update deposit status
      const { error: updateError } = await supabase
        .from("deposits")
        .update({
          status: "completed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      if (updateError) {
        console.error("Error updating deposit:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update deposit" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Credit user balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance, total_deposited")
        .eq("user_id", deposit.user_id)
        .single();

      if (profileError || !profile) {
        console.error("Profile not found:", deposit.user_id);
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: (profile.balance || 0) + deposit.amount,
          total_deposited: (profile.total_deposited || 0) + deposit.amount,
        })
        .eq("user_id", deposit.user_id);

      if (balanceError) {
        console.error("Error updating balance:", balanceError);
        return new Response(
          JSON.stringify({ error: "Failed to update balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: deposit.user_id,
        type: "deposit",
        amount: deposit.amount,
        balance_before: profile.balance || 0,
        balance_after: (profile.balance || 0) + deposit.amount,
        status: "completed",
        reference_id: deposit.id,
        metadata: {
          s6xpay_transaction_id: transaction_id,
          pix_data,
        },
      });

      // Create notification
      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Depósito confirmado!",
        message: `Seu depósito de R$ ${deposit.amount.toFixed(2)} foi confirmado e creditado em sua conta.`,
        type: "success",
      });

      console.log("Deposit confirmed successfully:", deposit.id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== PAYMENT EXPIRED ======
    if (event === "payment.expired" && type === "cash_in") {
      const { error } = await supabase
        .from("deposits")
        .update({ status: "failed" })
        .eq("external_id", transaction_id);

      if (error) {
        console.error("Error updating expired deposit:", error);
      }

      console.log("Deposit marked as expired:", transaction_id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== WITHDRAWAL COMPLETED ======
    if (event === "withdrawal.completed" && type === "cash_out") {
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("external_id", transaction_id)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error("Withdrawal not found:", transaction_id);
        return new Response(
          JSON.stringify({ success: true, message: "Withdrawal not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (withdrawal.status === "completed") {
        console.log("Withdrawal already completed:", withdrawal.id);
        return new Response(
          JSON.stringify({ success: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update withdrawal status
      await supabase
        .from("withdrawals")
        .update({
          status: "completed",
          approved_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      // Update profile total withdrawn
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_withdrawn")
        .eq("user_id", withdrawal.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({
          total_withdrawn: (profile?.total_withdrawn || 0) + withdrawal.amount,
        })
        .eq("user_id", withdrawal.user_id);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Saque realizado!",
        message: `Seu saque de R$ ${withdrawal.amount.toFixed(2)} foi processado com sucesso.`,
        type: "success",
      });

      console.log("Withdrawal completed:", withdrawal.id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== WITHDRAWAL FAILED ======
    if (event === "withdrawal.failed" && type === "cash_out") {
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("external_id", transaction_id)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error("Withdrawal not found:", transaction_id);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as failed
      await supabase
        .from("withdrawals")
        .update({
          status: "failed",
          rejected_reason: payload.error || "Falha no processamento",
        })
        .eq("id", withdrawal.id);

      // Refund user balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", withdrawal.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({
          balance: (profile?.balance || 0) + withdrawal.amount,
        })
        .eq("user_id", withdrawal.user_id);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Saque falhou",
        message: `Seu saque de R$ ${withdrawal.amount.toFixed(2)} não pôde ser processado. O valor foi devolvido ao seu saldo.`,
        type: "error",
      });

      console.log("Withdrawal failed and refunded:", withdrawal.id);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Unhandled webhook event:", event);
    return new Response(
      JSON.stringify({ success: true, message: "Event not handled" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
