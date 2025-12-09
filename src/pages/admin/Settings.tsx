import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as SystemSetting[];
    },
  });

  const [formData, setFormData] = useState({
    min_deposit: 10,
    max_deposit: 50000,
    min_withdrawal: 20,
    max_withdrawal: 10000,
    withdrawal_fee_percent: 0,
    max_daily_withdrawals: 3,
    kyc_required: false,
    kyc_min_amount: 1000,
    referral_bonus: 10,
    first_deposit_bonus: 100,
  });

  useEffect(() => {
    if (settings) {
      const newFormData: any = { ...formData };
      settings.forEach((setting) => {
        if (setting.key in newFormData) {
          newFormData[setting.key] = setting.value;
        }
      });
      setFormData(newFormData);
    }
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const existing = settings?.find((s) => s.key === key);
      if (existing) {
        const { error } = await supabase
          .from("system_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_settings")
          .insert({ key, value, category: "general" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(formData)) {
        await updateSetting.mutateAsync({ key, value });
      }
      toast.success("Configurações salvas!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configurações Gerais</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Limites de Transações</CardTitle>
              <CardDescription>
                Configure os limites para depósitos e saques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_deposit">Depósito Mínimo (R$)</Label>
                  <Input
                    id="min_deposit"
                    type="number"
                    value={formData.min_deposit}
                    onChange={(e) => setFormData({ ...formData, min_deposit: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_deposit">Depósito Máximo (R$)</Label>
                  <Input
                    id="max_deposit"
                    type="number"
                    value={formData.max_deposit}
                    onChange={(e) => setFormData({ ...formData, max_deposit: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_withdrawal">Saque Mínimo (R$)</Label>
                  <Input
                    id="min_withdrawal"
                    type="number"
                    value={formData.min_withdrawal}
                    onChange={(e) => setFormData({ ...formData, min_withdrawal: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_withdrawal">Saque Máximo (R$)</Label>
                  <Input
                    id="max_withdrawal"
                    type="number"
                    value={formData.max_withdrawal}
                    onChange={(e) => setFormData({ ...formData, max_withdrawal: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_fee">Taxa de Saque (%)</Label>
                  <Input
                    id="withdrawal_fee"
                    type="number"
                    step="0.1"
                    value={formData.withdrawal_fee_percent}
                    onChange={(e) => setFormData({ ...formData, withdrawal_fee_percent: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_daily_withdrawals">Máximo de Saques Diários</Label>
                  <Input
                    id="max_daily_withdrawals"
                    type="number"
                    value={formData.max_daily_withdrawals}
                    onChange={(e) => setFormData({ ...formData, max_daily_withdrawals: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verificação KYC</CardTitle>
              <CardDescription>
                Configure as regras de verificação de identidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>KYC Obrigatório</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir verificação para saques acima do limite
                  </p>
                </div>
                <Switch
                  checked={formData.kyc_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, kyc_required: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kyc_min_amount">Valor Mínimo para KYC (R$)</Label>
                <Input
                  id="kyc_min_amount"
                  type="number"
                  value={formData.kyc_min_amount}
                  onChange={(e) => setFormData({ ...formData, kyc_min_amount: parseFloat(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bônus Padrão</CardTitle>
              <CardDescription>
                Configure os bônus automáticos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referral_bonus">Bônus de Indicação (R$)</Label>
                  <Input
                    id="referral_bonus"
                    type="number"
                    value={formData.referral_bonus}
                    onChange={(e) => setFormData({ ...formData, referral_bonus: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_deposit_bonus">Bônus 1º Depósito (%)</Label>
                  <Input
                    id="first_deposit_bonus"
                    type="number"
                    value={formData.first_deposit_bonus}
                    onChange={(e) => setFormData({ ...formData, first_deposit_bonus: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </AdminLayout>
  );
};

export default Settings;
