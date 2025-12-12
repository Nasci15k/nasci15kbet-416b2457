import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlayfiversRequest {
  action: "getGameUrl" | "getBalance" | "getProviders" | "getGames" | "syncGames";
  gameCode?: string;
  userId?: string;
  providerId?: number;
  provider?: string;
  gameOriginal?: boolean;
}

const BASE_URL = "https://playfiver.app";

async function fetchPlayfivers(url: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    console.log("Fetching:", url, "Method:", options.method || "GET");
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();
    
    console.log("Response status:", response.status, "Content-Type:", contentType);
    console.log("Response preview:", responseText.substring(0, 500));

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${responseText.substring(0, 200)}` };
    }

    try {
      const data = JSON.parse(responseText);
      return { ok: true, data };
    } catch {
      return { ok: false, error: `Invalid JSON response: ${responseText.substring(0, 200)}` };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown fetch error" };
  }
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

    // Get API settings
    const { data: apiSettings, error: settingsError } = await supabase
      .from("api_settings")
      .select("*")
      .eq("provider", "playfivers")
      .maybeSingle();

    if (settingsError || !apiSettings) {
      console.error("API settings not found:", settingsError);
      return new Response(
        JSON.stringify({ error: "API settings not configured. Configure nas Configurações de API." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { agent_token, secret_key } = apiSettings;
    
    if (!agent_token || !secret_key) {
      return new Response(
        JSON.stringify({ error: "Agent Token ou Secret Key não configurados" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: PlayfiversRequest = await req.json();
    console.log("Action requested:", body.action);

    // ====== GET GAME URL ======
    if (body.action === "getGameUrl") {
      if (!body.userId || !body.gameCode) {
        return new Response(
          JSON.stringify({ error: "userId and gameCode are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profile for balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", body.userId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("User not found:", body.userId, profileError);
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado. Faça login novamente." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get game info to get provider name
      const { data: game } = await supabase
        .from("games")
        .select("*, game_providers(name)")
        .eq("external_code", body.gameCode)
        .maybeSingle();

      console.log("Opening game for user:", profile.user_id, "Balance:", profile.balance);

      const requestBody = {
        agentToken: agent_token,
        secretKey: secret_key,
        user_code: profile.user_id,
        game_code: body.gameCode,
        provider: body.provider || game?.game_providers?.name || "",
        game_original: body.gameOriginal ?? game?.is_original ?? true,
        user_balance: profile.balance || 0,
        user_rtp: apiSettings.rtp_default || 97,
        lang: "pt",
      };

      console.log("Playfivers request:", JSON.stringify({ ...requestBody, secretKey: "[HIDDEN]" }));

      const result = await fetchPlayfivers(`${BASE_URL}/api/v2/game_launch`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      
      if (!result.ok) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (result.data?.status === false || result.data?.error) {
        return new Response(
          JSON.stringify({ error: result.data?.msg || result.data?.error || "Erro ao abrir jogo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          game_url: result.data?.launch_url,
          ...result.data 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== GET PROVIDERS ======
    if (body.action === "getProviders") {
      console.log("Fetching providers from Playfivers...");
      
      const result = await fetchPlayfivers(`${BASE_URL}/api/v2/providers`);
      
      if (!result.ok) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify(result.data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== GET GAMES ======
    if (body.action === "getGames") {
      console.log("Fetching games from provider:", body.providerId);
      
      let url = `${BASE_URL}/api/v2/games`;
      if (body.providerId) {
        url += `?provider=${body.providerId}`;
      }
      
      const result = await fetchPlayfivers(url);
      
      if (!result.ok) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify(result.data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ====== SYNC GAMES ======
    if (body.action === "syncGames") {
      console.log("Starting full sync with Playfivers...");
      
      // Get providers first (GET request)
      const providersResult = await fetchPlayfivers(`${BASE_URL}/api/v2/providers`);
      
      if (!providersResult.ok) {
        return new Response(
          JSON.stringify({ error: `Erro ao buscar provedores: ${providersResult.error}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providersData = providersResult.data;
      console.log("Providers response:", JSON.stringify(providersData).substring(0, 500));
      
      // API returns { status: 1, data: [...], msg: "" }
      if (providersData?.status !== 1 || !providersData?.data) {
        console.error("Failed to fetch providers:", providersData);
        return new Response(
          JSON.stringify({ 
            error: `Falha ao buscar provedores. Resposta: ${JSON.stringify(providersData || {}).substring(0, 300)}` 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert/update providers
      let providersCount = 0;
      for (const provider of providersData.data || []) {
        const slug = (provider.name || `provider-${provider.id}`).toLowerCase().replace(/[^a-z0-9]+/g, "-");
        
        // Check if provider exists
        const { data: existingProvider } = await supabase
          .from("game_providers")
          .select("id")
          .eq("external_id", provider.id)
          .maybeSingle();

        if (existingProvider) {
          await supabase
            .from("game_providers")
            .update({
              name: provider.name,
              logo: provider.image || null,
              is_active: true,
            })
            .eq("external_id", provider.id);
        } else {
          await supabase
            .from("game_providers")
            .insert({
              external_id: provider.id,
              name: provider.name,
              slug,
              logo: provider.image || null,
              is_active: true,
            });
        }
        providersCount++;
      }

      console.log("Providers synced:", providersCount);

      // Get all games (GET request)
      const gamesResult = await fetchPlayfivers(`${BASE_URL}/api/v2/games`);
      
      if (!gamesResult.ok) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Provedores sincronizados (${providersCount}), mas erro ao buscar jogos: ${gamesResult.error}` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gamesData = gamesResult.data;
      console.log("Games response status:", gamesData?.status, "Count:", gamesData?.data?.length);

      if (gamesData?.status !== 1 || !gamesData?.data) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Provedores sincronizados (${providersCount}), mas falha ao processar jogos.` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert games
      let totalGames = 0;
      for (const game of gamesData.data) {
        // Get provider from DB by name or id
        const { data: dbProvider } = await supabase
          .from("game_providers")
          .select("id")
          .or(`external_id.eq.${game.provider_id},name.ilike.${game.provider || ''}`)
          .maybeSingle();

        // Check if game exists
        const { data: existingGame } = await supabase
          .from("games")
          .select("id")
          .eq("external_code", String(game.game_code || game.id))
          .maybeSingle();

        const gameData = {
          name: game.game_name || game.name,
          image: game.image || game.banner || null,
          provider_id: dbProvider?.id || null,
          is_active: true,
          is_original: game.game_original ?? game.original ?? false,
          rtp: game.rtp || null,
        };

        if (existingGame) {
          await supabase
            .from("games")
            .update(gameData)
            .eq("external_code", String(game.game_code || game.id));
        } else {
          await supabase
            .from("games")
            .insert({
              external_code: String(game.game_code || game.id),
              ...gameData,
            });
        }
        
        totalGames++;
      }

      console.log("Sync complete. Total games:", totalGames);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Sincronizado com sucesso! ${providersCount} provedores e ${totalGames} jogos.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
