import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlayfiversResponse {
  status?: string;
  game_url?: string;
  error?: string;
  message?: string;
  success?: boolean;
}

export const useSyncGames = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<PlayfiversResponse>("playfivers", {
        body: { action: "syncGames" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["all-games"] });
      queryClient.invalidateQueries({ queryKey: ["game-providers"] });
      queryClient.invalidateQueries({ queryKey: ["all-game-providers"] });
      toast.success(data?.message || "Jogos sincronizados com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });
};

export const useLaunchGame = () => {
  return useMutation({
    mutationFn: async ({ gameCode, userId }: { gameCode: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke<PlayfiversResponse>("playfivers", {
        body: { 
          action: "getGameUrl",
          gameCode,
          userId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onError: (error: Error) => {
      toast.error("Erro ao iniciar jogo: " + error.message);
    },
  });
};

export const useGetProviders = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<PlayfiversResponse>("playfivers", {
        body: { action: "getProviders" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
  });
};

export const useGetGames = () => {
  return useMutation({
    mutationFn: async ({ providerCode, page }: { providerCode: number; page?: number }) => {
      const { data, error } = await supabase.functions.invoke<PlayfiversResponse>("playfivers", {
        body: { 
          action: "getGames",
          providerCode,
          page: page || 1,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
  });
};
