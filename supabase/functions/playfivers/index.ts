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

// Use proxy for API calls
const PROXY_URL = "https://proxycassino.onrender.com";
const BASE_URL = "https://api.playfivers.com";

async function fetchPlayfivers(url: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    // Route through proxy
    const proxyUrl = `${PROXY_URL}/proxy?url=${encodeURIComponent(url)}`;
    console.log("Fetching via proxy:", proxyUrl, "Method:", options.method || "GET");
    
    const response = await fetch(proxyUrl, {
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
        agent_token: agent_token,
        secret_key: secret_key,
        user_code: profile.user_id,
        game_code: body.gameCode,
        provider: body.provider || game?.game_providers?.name || "",
        game_original: body.gameOriginal ?? game?.is_original ?? true,
        user_balance: profile.balance || 0,
        user_rtp: apiSettings.rtp_default || 97,
        lang: "pt",
      };

      console.log("Playfivers request:", JSON.stringify({ ...requestBody, secret_key: "[HIDDEN]" }));

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
      console.log("Starting full sync with Playfivers via proxy...");

      // 1) Fetch providers
      const providersResult = await fetchPlayfivers(`${BASE_URL}/api/v2/providers`);

      if (!providersResult.ok) {
        return new Response(
          JSON.stringify({ error: `Erro ao buscar provedores: ${providersResult.error}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providersData = providersResult.data;

      // API returns { status: 1, data: [...], msg: "" }
      if (providersData?.status !== 1 || !Array.isArray(providersData?.data)) {
        console.error("Failed to fetch providers:", providersData);
        return new Response(
          JSON.stringify({
            error: `Falha ao buscar provedores. Resposta: ${JSON.stringify(providersData || {}).substring(0, 300)}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providerRows = providersData.data.map((p: any) => {
        const slug = (p.name || `provider-${p.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        return {
          external_id: p.id,
          name: p.name,
          slug,
          logo: p.image_url || p.image || null,
          is_active: p.status === 1,
        };
      });

      const { error: upsertProvidersError } = await supabase
        .from("game_providers")
        .upsert(providerRows, { onConflict: "external_id" });

      if (upsertProvidersError) {
        console.error("Provider upsert error:", upsertProvidersError);
        return new Response(
          JSON.stringify({ error: `Erro ao salvar provedores: ${upsertProvidersError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providersCount = providerRows.length;
      console.log("Providers synced:", providersCount);

      // 2) Build provider name -> id map (single query)
      const { data: dbProviders, error: dbProvidersError } = await supabase
        .from("game_providers")
        .select("id,name,external_id");

      if (dbProvidersError) {
        console.error("DB providers fetch error:", dbProvidersError);
        return new Response(
          JSON.stringify({ error: `Erro ao ler provedores do banco: ${dbProvidersError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providerNameToId = new Map<string, string>();
      for (const p of dbProviders || []) {
        if (p?.name) providerNameToId.set(String(p.name).toLowerCase(), p.id);
      }

      // 3) Fetch games - using pagination to get ALL games
      let allGames: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const gamesResult = await fetchPlayfivers(`${BASE_URL}/api/v2/games?page=${page}&limit=1000`);

        if (!gamesResult.ok) {
          console.error("Error fetching games page", page, gamesResult.error);
          break;
        }

        const gamesData = gamesResult.data;
        const gamesArray = Array.isArray(gamesData?.data) ? gamesData.data : [];
        
        console.log(`Games page ${page}: status=${gamesData?.status}, count=${gamesArray.length}`);
        
        if (gamesArray.length === 0) {
          hasMore = false;
        } else {
          allGames = [...allGames, ...gamesArray];
          page++;
          
          // Safety: stop if we've gotten a reasonable amount
          if (allGames.length >= 10000 || gamesArray.length < 1000) {
            hasMore = false;
          }
        }
      }

      console.log("Total games fetched:", allGames.length);

      if (allGames.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Provedores sincronizados (${providersCount}), mas nenhum jogo encontrado.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4) Upsert games in batches (fast + avoids timeout)
      const gameRows = allGames
        .map((g: any) => {
          const providerName = String(g?.provider?.name || g?.provider || "").toLowerCase();
          const provider_id = providerNameToId.get(providerName) || null;
          const external_code = String(g.game_code || g.id);

          return {
            external_code,
            name: g.name || g.game_name,
            image: g.image_url || g.image || g.banner || null,
            provider_id,
            is_active: g.status === true || g.status === 1,
            is_original: g.original ?? g.game_original ?? false,
            rtp: g.rtp || null,
          };
        })
        .filter((row: any) => row.external_code && row.name);

      const chunkSize = 500;
      for (let i = 0; i < gameRows.length; i += chunkSize) {
        const chunk = gameRows.slice(i, i + chunkSize);
        const { error: upsertGamesError } = await supabase
          .from("games")
          .upsert(chunk, { onConflict: "external_code" });

        if (upsertGamesError) {
          console.error("Games upsert error (chunk):", upsertGamesError);
          return new Response(
            JSON.stringify({
              success: true,
              message: `Provedores sincronizados (${providersCount}), mas erro ao salvar jogos: ${upsertGamesError.message}`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Upserted games: ${Math.min(i + chunkSize, gameRows.length)}/${gameRows.length}`);
      }

      console.log("Sync complete. Total games:", gameRows.length);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Sincronizado com sucesso! ${providersCount} provedores e ${gameRows.length} jogos.`,
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