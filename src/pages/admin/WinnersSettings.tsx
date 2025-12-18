import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Trophy, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface WinnersSettings {
  id: string;
  is_enabled: boolean;
  auto_generate: boolean;
  display_count: number;
  min_amount: number;
  max_amount: number;
  refresh_interval: number;
}

interface Winner {
  id: string;
  user_name: string;
  game_name: string;
  game_image: string | null;
  amount: number;
  is_manual: boolean;
  is_active: boolean;
}

const WinnersSettingsPage = () => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWinner, setNewWinner] = useState({
    user_name: "",
    game_name: "",
    game_image: "",
    amount: 0,
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["winners-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners_settings")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      return data as WinnersSettings | null;
    },
  });

  // Fetch manual winners
  const { data: winners, isLoading: winnersLoading } = useQuery({
    queryKey: ["admin-winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Winner[];
    },
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WinnersSettings>) => {
      if (!settings?.id) {
        // Create if not exists
        const { error } = await supabase.from("winners_settings").insert([updates]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("winners_settings")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["winners-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Add winner
  const addWinner = useMutation({
    mutationFn: async (winner: typeof newWinner) => {
      const { error } = await supabase.from("winners").insert([{
        ...winner,
        is_manual: true,
        is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-winners"] });
      toast.success("Ganhador adicionado!");
      setIsAddOpen(false);
      setNewWinner({ user_name: "", game_name: "", game_image: "", amount: 0 });
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Delete winner
  const deleteWinner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("winners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-winners"] });
      toast.success("Ganhador removido!");
    },
  });

  // Toggle winner active
  const toggleWinner = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("winners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-winners"] });
    },
  });

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-casino-gold" />
          <h1 className="text-2xl font-bold">Configurações de Ganhadores</h1>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configure como os ganhadores são exibidos na página principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Exibir Seção de Ganhadores</Label>
                <p className="text-sm text-muted-foreground">Mostrar/ocultar na página principal</p>
              </div>
              <Switch
                checked={settings?.is_enabled ?? true}
                onCheckedChange={(checked) => updateSettings.mutate({ is_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Geração Automática</Label>
                <p className="text-sm text-muted-foreground">Gerar ganhadores aleatórios automaticamente</p>
              </div>
              <Switch
                checked={settings?.auto_generate ?? true}
                onCheckedChange={(checked) => updateSettings.mutate({ auto_generate: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade Exibida</Label>
                <Input
                  type="number"
                  value={settings?.display_count ?? 10}
                  onChange={(e) => updateSettings.mutate({ display_count: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Intervalo de Atualização (segundos)</Label>
                <Input
                  type="number"
                  value={settings?.refresh_interval ?? 30}
                  onChange={(e) => updateSettings.mutate({ refresh_interval: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  value={settings?.min_amount ?? 100}
                  onChange={(e) => updateSettings.mutate({ min_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  value={settings?.max_amount ?? 5000}
                  onChange={(e) => updateSettings.mutate({ max_amount: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Winners */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ganhadores Manuais</CardTitle>
                <CardDescription>
                  Adicione ganhadores manualmente (usados quando geração automática está desativada)
                </CardDescription>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Ganhador</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do Jogador</Label>
                      <Input
                        placeholder="Ex: João ****"
                        value={newWinner.user_name}
                        onChange={(e) => setNewWinner({ ...newWinner, user_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Jogo</Label>
                      <Input
                        placeholder="Ex: Fortune Tiger"
                        value={newWinner.game_name}
                        onChange={(e) => setNewWinner({ ...newWinner, game_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL da Imagem (opcional)</Label>
                      <Input
                        placeholder="https://..."
                        value={newWinner.game_image}
                        onChange={(e) => setNewWinner({ ...newWinner, game_image: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Ganho (R$)</Label>
                      <Input
                        type="number"
                        value={newWinner.amount}
                        onChange={(e) => setNewWinner({ ...newWinner, amount: parseFloat(e.target.value) })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => addWinner.mutate(newWinner)}
                      disabled={addWinner.isPending}
                    >
                      {addWinner.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {winnersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Jogo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {winners?.map((winner) => (
                    <TableRow key={winner.id}>
                      <TableCell>{winner.user_name}</TableCell>
                      <TableCell>{winner.game_name}</TableCell>
                      <TableCell>R$ {winner.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Switch
                          checked={winner.is_active}
                          onCheckedChange={(checked) => 
                            toggleWinner.mutate({ id: winner.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteWinner.mutate(winner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!winners || winners.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum ganhador manual cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WinnersSettingsPage;