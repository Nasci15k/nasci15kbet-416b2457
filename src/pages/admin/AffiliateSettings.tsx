import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const AffiliateSettings = () => {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["affiliate-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    commission_percent: 30,
    commission_type: "revenue_share",
    cookie_days: 30,
    min_payout: 100,
    is_active: true,
    terms: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        commission_percent: settings.commission_percent || 30,
        commission_type: settings.commission_type || "revenue_share",
        cookie_days: settings.cookie_days || 30,
        min_payout: settings.min_payout || 100,
        is_active: settings.is_active ?? true,
        terms: settings.terms || "",
      });
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (settings?.id) {
        const { error } = await supabase
          .from("affiliate_settings")
          .update(data)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("affiliate_settings")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
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
        <h1 className="text-2xl font-bold">Configurações de Afiliados</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as regras do programa de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Programa Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar ou desabilitar o programa de afiliados
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comissões</CardTitle>
              <CardDescription>
                Configure como os afiliados serão remunerados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commission_type">Tipo de Comissão</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value) => setFormData({ ...formData, commission_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue_share">Revenue Share</SelectItem>
                      <SelectItem value="cpa">CPA (Custo por Aquisição)</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_percent">Porcentagem de Comissão</Label>
                  <Input
                    id="commission_percent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission_percent}
                    onChange={(e) => setFormData({ ...formData, commission_percent: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cookie_days">Dias do Cookie</Label>
                  <Input
                    id="cookie_days"
                    type="number"
                    min="1"
                    value={formData.cookie_days}
                    onChange={(e) => setFormData({ ...formData, cookie_days: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Por quantos dias o afiliado recebe comissão após o clique
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_payout">Pagamento Mínimo (R$)</Label>
                  <Input
                    id="min_payout"
                    type="number"
                    min="0"
                    value={formData.min_payout}
                    onChange={(e) => setFormData({ ...formData, min_payout: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termos e Condições</CardTitle>
              <CardDescription>
                Termos do programa de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={6}
                placeholder="Digite os termos e condições do programa de afiliados..."
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AffiliateSettings;
