import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateDepositParams {
  amount: number;
}

interface CreateWithdrawalParams {
  amount: number;
  pix_key: string;
  pix_key_type: string;
}

interface DepositResponse {
  success: boolean;
  deposit: {
    id: string;
    amount: number;
    pix_code: string;
    qr_code_base64: string;
    expires_at: string;
  };
}

interface WithdrawalResponse {
  success: boolean;
  withdrawal: {
    id: string;
    amount: number;
    fee: number;
    net_amount: number;
    status: string;
  };
}

export const useCreateDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDepositParams): Promise<DepositResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("s6xpay", {
        body: {
          action: "createDeposit",
          amount: params.amount,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar depósito");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao criar depósito");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateWithdrawalParams): Promise<WithdrawalResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("s6xpay", {
        body: {
          action: "createWithdrawal",
          amount: params.amount,
          pix_key: params.pix_key,
          pix_key_type: params.pix_key_type,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar saque");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Erro ao criar saque");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCheckDepositStatus = () => {
  return useMutation({
    mutationFn: async (depositId: string): Promise<{ status: string }> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("s6xpay", {
        body: {
          action: "checkDeposit",
          deposit_id: depositId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
  });
};
