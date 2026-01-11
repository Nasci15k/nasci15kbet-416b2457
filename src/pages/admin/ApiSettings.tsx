import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApiSettings, useUpdateApiSettings } from "@/hooks/useSettings";
import { useSyncGames } from "@/hooks/usePlayfivers";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, AlertCircle, Download, Loader2, CheckCircle, Copy, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ApiSettings = () => {
  const { data: apiSettings, isLoading } = useApiSettings();
  const updateApiSettings = useUpdateApiSettings();
  const syncGames = useSyncGames();

  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [ipDetectedAt, setIpDetectedAt] = useState<string | null>(null);
  const [isLoadingIP, setIsLoadingIP] = useState(false);
  
  const [formData, setFormData] = useState({
    provider: "playfivers",
    agent_token: "",
    secret_key: "",
    webhook_url: "",
    is_active: true,
    rtp_default: 97,
  });

  // Generate webhook URL
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/playfivers-webhook`;

  useEffect(() => {
    const playfivers = apiSettings?.find((s) => s.provider === "playfivers");
    if (playfivers) {
      setFormData({
        provider: "playfivers",
        agent_token: playfivers.agent_token || "",
        secret_key: playfivers.secret_key || "",
        webhook_url: playfivers.webhook_url || webhookUrl,
        is_active: playfivers.is_active,
        rtp_default: playfivers.rtp_default || 97,
      });
    }
  }, [apiSettings, webhookUrl]);

  const handleSave = async () => {
    const existing = apiSettings?.find((s) => s.provider === "playfivers");
    
    await updateApiSettings.mutateAsync({
      id: existing?.id,
      ...formData,
    });
  };

  const handleSync = async () => {
    await syncGames.mutateAsync();
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada!");
  };

  const copyIP = () => {
    if (currentIP) {
      navigator.clipboard.writeText(currentIP);
      toast.success("IP copiado!");
    }
  };

  const detectIP = async () => {
    setIsLoadingIP(true);
    try {
      const { data, error } = await supabase.functions.invoke("playfivers", {
        body: { action: "getOutboundIP" },
      });

      if (error) {
        toast.error("Erro ao detectar IP: " + error.message);
        return;
      }

      if (data.success) {
        setCurrentIP(data.ip);
        setIpDetectedAt(data.detected_at);
        toast.success(`IP detectado: ${data.ip}`);
        toast.warning("Atenção: Este IP pode mudar a qualquer momento!", { duration: 5000 });
      } else {
        toast.error(data.error || "Erro ao detectar IP");
      }
    } catch (error: any) {
      toast.error("Erro ao detectar IP: " + error.message);
    } finally {
      setIsLoadingIP(false);
    }
  };

  // Load last saved IP on mount
  useEffect(() => {
    const loadLastIP = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "last_outbound_ip")
        .maybeSingle();
      
      if (data?.value) {
        const ipData = data.value as { ip: string; detected_at: string };
        setCurrentIP(ipData.ip);
        setIpDetectedAt(ipData.detected_at);
      }
    };
    loadLastIP();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  const isConfigured = formData.agent_token && formData.secret_key;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configurações da API</h2>
            <p className="text-muted-foreground">Configure a integração com a Playfivers</p>
          </div>
          {isConfigured && (
            <Button 
              onClick={handleSync} 
              disabled={syncGames.isPending}
              variant="outline"
            >
              {syncGames.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sincronizar Jogos
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <img 
                    src="https://playfivers.com/favicon.ico" 
                    alt="Playfivers" 
                    className="h-6 w-6"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div>
                  <CardTitle>Playfivers API</CardTitle>
                  <CardDescription>
                    Configure suas credenciais para habilitar jogos
                  </CardDescription>
                </div>
              </div>
              {isConfigured && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Configurado</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConfigured && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-500">Configuração Necessária</p>
                    <p className="text-sm text-muted-foreground">
                      Preencha as credenciais para ativar a integração
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>API Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar ou desabilitar a integração
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Agent Token</Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="SEU_TOKEN_DE_AGENTE"
                    value={formData.agent_token}
                    onChange={(e) =>
                      setFormData({ ...formData, agent_token: e.target.value })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="SUA_CHAVE_SECRETA"
                    value={formData.secret_key}
                    onChange={(e) =>
                      setFormData({ ...formData, secret_key: e.target.value })
                    }
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL (para transações)</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm bg-secondary"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL no painel da Playfivers para receber transações
                </p>
              </div>

              <div className="space-y-2">
                <Label>RTP Padrão (%)</Label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={formData.rtp_default}
                  onChange={(e) =>
                    setFormData({ ...formData, rtp_default: Number(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Taxa de retorno ao jogador padrão (50-100%)
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateApiSettings.isPending}>
                {updateApiSettings.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* IP Detection Card */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-orange-500">IP de Saída (Whitelist)</CardTitle>
                <CardDescription>
                  IP usado pelas Edge Functions para requisições externas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-orange-500">Atenção</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Edge Functions usam IPs dinâmicos que podem mudar a qualquer momento. 
                Adicione este IP à whitelist da Playfivers, mas esteja ciente que pode precisar atualizar periodicamente.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Último IP Detectado</Label>
              <div className="flex gap-2">
                <Input
                  value={currentIP || "Clique em 'Detectar IP' para obter"}
                  readOnly
                  className="font-mono text-lg bg-secondary"
                />
                <Button variant="outline" size="icon" onClick={copyIP} disabled={!currentIP}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {ipDetectedAt && (
                <p className="text-xs text-muted-foreground">
                  Detectado em: {new Date(ipDetectedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            <Button 
              onClick={detectIP} 
              disabled={isLoadingIP}
              className="w-full"
              variant="outline"
            >
              {isLoadingIP ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detectando IP...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Detectar IP Atual
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções de Integração</CardTitle>
            <CardDescription>
              Passos para configurar a integração completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Configure as Credenciais</p>
                  <p className="text-sm text-muted-foreground">
                    Insira o Agent Token e Secret Key fornecidos pela Playfivers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Configure o Webhook</p>
                  <p className="text-sm text-muted-foreground">
                    Copie a URL do webhook acima e configure no painel Playfivers para receber transações
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Sincronize os Jogos</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Sincronizar Jogos" para importar todos os provedores e jogos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  4
                </div>
                <div>
                  <p className="font-medium">Teste a Integração</p>
                  <p className="text-sm text-muted-foreground">
                    Faça login como usuário e inicie um jogo para verificar se tudo funciona
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ApiSettings;
