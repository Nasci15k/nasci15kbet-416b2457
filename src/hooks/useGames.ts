import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Game {
  id: string;
  name: string;
  external_code: string;
  image: string | null;
  provider_id: string | null;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_live: boolean;
  is_original: boolean;
  rtp: number | null;
  min_bet: number | null;
  max_bet: number | null;
  play_count: number;
  order_index: number;
}

export interface GameProvider {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  external_id: number | null;
  is_active: boolean;
  order_index: number;
}

export interface GameCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  order_index: number;
}

// Paginated games hook for homepage - loads games with pagination
export const useGames = (categoryId?: string, providerId?: string, search?: string) => {
  return useQuery({
    queryKey: ["games", categoryId, providerId, search],
    queryFn: async () => {
      let query = supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .limit(100); // Limit for initial load

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (providerId) {
        query = query.eq("provider_id", providerId);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Game[];
    },
  });
};

// Hook to get featured games
export const useFeaturedGames = () => {
  return useQuery({
    queryKey: ["featured-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("order_index", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as Game[];
    },
  });
};

// Hook to get games by provider with proper limit
export const useGamesByProvider = (providerId: string, limit = 15) => {
  return useQuery({
    queryKey: ["games-by-provider", providerId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .eq("provider_id", providerId)
        .order("play_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Game[];
    },
    enabled: !!providerId,
  });
};

// Hook to get all games with pagination (for provider pages)
export const useAllGamesWithPagination = (page = 0, pageSize = 50, providerId?: string) => {
  return useQuery({
    queryKey: ["all-games-paginated", page, pageSize, providerId],
    queryFn: async () => {
      let query = supabase
        .from("games")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("order_index", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (providerId) {
        query = query.eq("provider_id", providerId);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { games: data as Game[], total: count || 0 };
    },
  });
};

// Hook for admin - get total games count
export const useGamesCount = () => {
  return useQuery({
    queryKey: ["games-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("games")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useAllGames = () => {
  return useQuery({
    queryKey: ["all-games"],
    queryFn: async () => {
      // Fetch all games in batches to bypass 1000 limit
      const allGames: Game[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .order("order_index", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allGames.push(...(data as Game[]));
          page++;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      return allGames;
    },
  });
};

export const useGameProviders = () => {
  return useQuery({
    queryKey: ["game-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_providers")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as GameProvider[];
    },
  });
};

// Hook to get providers with game count
export const useProvidersWithGameCount = () => {
  return useQuery({
    queryKey: ["providers-with-game-count"],
    queryFn: async () => {
      const { data: providers, error: provError } = await supabase
        .from("game_providers")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (provError) throw provError;

      // Get game counts per provider
      const { data: gameCounts, error: countError } = await supabase
        .from("games")
        .select("provider_id")
        .eq("is_active", true);

      if (countError) throw countError;

      // Count games per provider
      const countMap = new Map<string, number>();
      gameCounts?.forEach((g) => {
        if (g.provider_id) {
          countMap.set(g.provider_id, (countMap.get(g.provider_id) || 0) + 1);
        }
      });

      return (providers || []).map((p) => ({
        ...p,
        gameCount: countMap.get(p.id) || 0,
      }));
    },
  });
};

export const useAllGameProviders = () => {
  return useQuery({
    queryKey: ["all-game-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_providers")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as GameProvider[];
    },
  });
};

export const useGameCategories = () => {
  return useQuery({
    queryKey: ["game-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_categories")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as GameCategory[];
    },
  });
};

export const useAllGameCategories = () => {
  return useQuery({
    queryKey: ["all-game-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as GameCategory[];
    },
  });
};

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (game: Omit<Game, "id" | "play_count" | "order_index"> & { external_code: string; name: string }) => {
      const { data, error } = await supabase
        .from("games")
        .insert([game])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["all-games"] });
      toast.success("Jogo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar jogo: " + error.message);
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...game }: Partial<Game> & { id: string }) => {
      const { data, error } = await supabase
        .from("games")
        .update(game)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["all-games"] });
      queryClient.invalidateQueries({ queryKey: ["featured-games"] });
      toast.success("Jogo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar jogo: " + error.message);
    },
  });
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["all-games"] });
      toast.success("Jogo deletado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao deletar jogo: " + error.message);
    },
  });
};

// Provider mutations
export const useCreateProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (provider: Omit<GameProvider, "id" | "order_index">) => {
      const { data, error } = await supabase
        .from("game_providers")
        .insert([provider])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-providers"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-providers"] });
      toast.success("Provedor criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar provedor: " + error.message);
    },
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...provider }: Partial<GameProvider> & { id: string }) => {
      const { data, error } = await supabase
        .from("game_providers")
        .update(provider)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-providers"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-providers"] });
      toast.success("Provedor atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar provedor: " + error.message);
    },
  });
};

export const useDeleteProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_providers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-providers"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-providers"] });
      toast.success("Provedor deletado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao deletar provedor: " + error.message);
    },
  });
};

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<GameCategory, "id" | "order_index">) => {
      const { data, error } = await supabase
        .from("game_categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<GameCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("game_categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-categories"] });
      toast.success("Categoria deletada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao deletar categoria: " + error.message);
    },
  });
};