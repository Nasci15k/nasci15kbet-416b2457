import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const S6XPAY_BASE_URL = "https://s6x.com.br/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("S6XPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("S6XPAY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing S6XPay credentials");
      return new Response(
        JSON.stringify({ error: "S6XPay não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    console.log(`S6XPay action: ${action} for user: ${user.id}`);

    // ====== CREATE DEPOSIT (CASH-IN) ======
    if (action === "createDeposit") {
      const { amount } = body;

      if (!amount || amount < 8 || amount > 899) {
        return new Response(
          JSON.stringify({ error: "Valor deve estar entre R$ 8,00 e R$ 899,00" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Perfil não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create payment via S6XPay
      const paymentResponse = await fetch(`${S6XPAY_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": clientId,
          "X-Client-Secret": clientSecret,
        },
        body: JSON.stringify({
          amount,
          customer: {
            name: profile.full_name || profile.name || user.email?.split("@")[0] || "Cliente",
            document: profile.cpf || "00000000000",
            email: profile.email || user.email,
          },
          description: `Depósito - ${profile.email}`,
          metadata: {
            user_id: user.id,
            profile_id: profile.id,
          },
        }),
      });

      const paymentData = await paymentResponse.json();
      console.log("S6XPay payment response:", JSON.stringify(paymentData));

      if (!paymentResponse.ok || !paymentData.success) {
        const errorMsg = paymentData.message || paymentData.error || "Erro ao criar pagamento";
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save deposit to database
      const { data: deposit, error: depositError } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount,
          status: "pending",
          external_id: paymentData.data.transaction_id,
          pix_code: paymentData.data.pix.copy_paste,
          qr_code: paymentData.data.pix.qr_code_base64,
          fee: paymentData.data.fee || 0,
          expires_at: paymentData.data.expires_at,
        })
        .select()
        .single();

      if (depositError) {
        console.error("Error saving deposit:", depositError);
        return new Response(
          JSON.stringify({ error: "Erro ao salvar depósito" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          deposit: {
            id: deposit.id,
            amount,
            pix_code: paymentData.data.pix.copy_paste,
            qr_code_base64: paymentData.data.pix.qr_code_base64,
            expires_at: paymentData.data.expires_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== CREATE WITHDRAWAL (CASH-OUT) ======
    if (action === "createWithdrawal") {
      const { amount, pix_key, pix_key_type } = body;

      if (!amount || amount < 10 || amount > 900) {
        return new Response(
          JSON.stringify({ error: "Valor deve estar entre R$ 10,00 e R$ 900,00" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!pix_key || !pix_key_type) {
        return new Response(
          JSON.stringify({ error: "Chave PIX é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profile and check balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "Perfil não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate fee (R$ 1.00 + 2%)
      const fee = 1 + (amount * 0.02);
      const netAmount = amount - fee;

      if ((profile.balance || 0) < amount) {
        return new Response(
          JSON.stringify({ error: "Saldo insuficiente" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Map pix_key_type to S6XPay format
      const pixKeyTypeMap: Record<string, string> = {
        cpf: "CPF",
        cnpj: "CNPJ",
        email: "EMAIL",
        phone: "PHONE",
        random: "EVP",
        evp: "EVP",
      };

      // Create withdrawal request in database first (pending)
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          amount,
          fee,
          status: "pending",
          pix_key,
          pix_key_type,
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error("Error saving withdrawal:", withdrawalError);
        return new Response(
          JSON.stringify({ error: "Erro ao salvar saque" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct from user balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: (profile.balance || 0) - amount,
        })
        .eq("user_id", user.id);

      if (balanceError) {
        console.error("Error updating balance:", balanceError);
        // Rollback withdrawal
        await supabase.from("withdrawals").delete().eq("id", withdrawal.id);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar saldo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Try to process via S6XPay (optional - can be done manually by admin)
      try {
        const withdrawalResponse = await fetch(`${S6XPAY_BASE_URL}/withdrawals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Id": clientId,
            "X-Client-Secret": clientSecret,
          },
          body: JSON.stringify({
            amount: netAmount,
            pix_key,
            pix_key_type: pixKeyTypeMap[pix_key_type.toLowerCase()] || "CPF",
            description: `Saque - ${profile.email}`,
          }),
        });

        const withdrawalData = await withdrawalResponse.json();
        console.log("S6XPay withdrawal response:", JSON.stringify(withdrawalData));

        if (withdrawalResponse.ok && withdrawalData.success) {
          // Update withdrawal with external ID and mark as processing
          await supabase
            .from("withdrawals")
            .update({
              external_id: withdrawalData.data?.transaction_id,
              status: "pending", // Keep as pending, will be updated by webhook
            })
            .eq("id", withdrawal.id);
        } else {
          console.log("S6XPay withdrawal failed, will be processed manually:", withdrawalData);
          // Keep as pending for manual processing
        }
      } catch (s6xError) {
        console.error("S6XPay withdrawal error:", s6xError);
        // Keep as pending for manual processing
      }

      return new Response(
        JSON.stringify({
          success: true,
          withdrawal: {
            id: withdrawal.id,
            amount,
            fee,
            net_amount: netAmount,
            status: "pending",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== CHECK DEPOSIT STATUS ======
    if (action === "checkDeposit") {
      const { deposit_id } = body;

      if (!deposit_id) {
        return new Response(
          JSON.stringify({ error: "ID do depósito é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: deposit, error: depositError } = await supabase
        .from("deposits")
        .select("*")
        .eq("id", deposit_id)
        .eq("user_id", user.id)
        .single();

      if (depositError || !deposit) {
        return new Response(
          JSON.stringify({ error: "Depósito não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If already completed, return status
      if (deposit.status === "completed") {
        return new Response(
          JSON.stringify({ success: true, status: "completed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check status via S6XPay API
      if (deposit.external_id) {
        try {
          const statusResponse = await fetch(
            `${S6XPAY_BASE_URL}/payments/${deposit.external_id}`,
            {
              method: "GET",
              headers: {
                "X-Client-Id": clientId,
                "X-Client-Secret": clientSecret,
              },
            }
          );

          const statusData = await statusResponse.json();
          console.log("S6XPay status check:", JSON.stringify(statusData));

          if (statusResponse.ok && statusData.success) {
            const s6xStatus = statusData.data.status;

            if (s6xStatus === "paid" && deposit.status === "pending") {
              // Update deposit and credit balance
              await supabase
                .from("deposits")
                .update({
                  status: "completed",
                  confirmed_at: new Date().toISOString(),
                })
                .eq("id", deposit.id);

              // Get current profile balance
              const { data: profileData } = await supabase
                .from("profiles")
                .select("balance, total_deposited")
                .eq("user_id", user.id)
                .single();

              // Credit balance
              await supabase
                .from("profiles")
                .update({
                  balance: (profileData?.balance || 0) + deposit.amount,
                  total_deposited: (profileData?.total_deposited || 0) + deposit.amount,
                })
                .eq("user_id", user.id);

              return new Response(
                JSON.stringify({ success: true, status: "completed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            if (s6xStatus === "expired" || s6xStatus === "cancelled") {
              await supabase
                .from("deposits")
                .update({ status: s6xStatus === "expired" ? "failed" : "cancelled" })
                .eq("id", deposit.id);

              return new Response(
                JSON.stringify({ success: true, status: s6xStatus }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        } catch (err) {
          console.error("Error checking S6XPay status:", err);
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: deposit.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== GET BALANCE ======
    if (action === "getBalance") {
      try {
        const balanceResponse = await fetch(`${S6XPAY_BASE_URL}/balance`, {
          method: "GET",
          headers: {
            "X-Client-Id": clientId,
            "X-Client-Secret": clientSecret,
          },
        });

        const balanceData = await balanceResponse.json();

        if (balanceResponse.ok && balanceData.success) {
          return new Response(
            JSON.stringify({ success: true, balance: balanceData.data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.error("Error getting S6XPay balance:", err);
      }

      return new Response(
        JSON.stringify({ error: "Erro ao consultar saldo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("S6XPay function error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
