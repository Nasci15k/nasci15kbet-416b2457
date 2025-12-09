import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAllGames, useUpdateGame, useDeleteGame, useAllGameProviders } from "@/hooks/useGames";
import { useSyncGames } from "@/hooks/usePlayfivers";
import { Search, Edit, Trash2, RefreshCw, Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Games = () => {
  const { data: games, isLoading, refetch } = useAllGames();
  const { data: providers } = useAllGameProviders();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();
  const syncGames = useSyncGames();

  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);

  const filteredGames = games?.filter((game) =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  const getProviderName = (providerId: string | null) => {
    if (!providerId) return "N/A";
    return providers?.find((p) => p.id === providerId)?.name || "N/A";
  };

  const handleToggleActive = async (game: any) => {
    await updateGame.mutateAsync({
      id: game.id,
      is_active: !game.is_active,
    });
  };

  const handleToggleFeatured = async (game: any) => {
    await updateGame.mutateAsync({
      id: game.id,
      is_featured: !game.is_featured,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este jogo?")) {
      await deleteGame.mutateAsync(id);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedGame) return;
    
    await updateGame.mutateAsync({
      id: selectedGame.id,
      name: selectedGame.name,
      rtp: selectedGame.rtp,
      min_bet: selectedGame.min_bet,
      max_bet: selectedGame.max_bet,
      is_active: selectedGame.is_active,
      is_featured: selectedGame.is_featured,
      is_new: selectedGame.is_new,
    });
    
    setEditModal(false);
  };

  const handleSyncGames = async () => {
    await syncGames.mutateAsync();
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Jogos</h2>
            <p className="text-muted-foreground">
              Gerencie todos os jogos • {games?.length || 0} jogos no total
            </p>
          </div>
          <Button 
            onClick={handleSyncGames} 
            disabled={syncGames.isPending}
          >
            {syncGames.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Sincronizar com Playfivers
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jogos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>RTP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead>Jogadas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredGames?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum jogo encontrado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure a API Playfivers e clique em "Sincronizar" para importar jogos
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames?.slice(0, 50).map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {game.image && (
                            <img
                              src={game.image}
                              alt={game.name}
                              className="h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/40x40/1a1a2e/ffffff?text=?";
                              }}
                            />
                          )}
                          <div>
                            <span className="font-medium">{game.name}</span>
                            <p className="text-xs text-muted-foreground">{game.external_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getProviderName(game.provider_id)}
                      </TableCell>
                      <TableCell>{game.rtp || 96}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {game.is_new && <Badge variant="secondary">Novo</Badge>}
                          {game.is_live && <Badge variant="outline">Live</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={game.is_active}
                          onCheckedChange={() => handleToggleActive(game)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={game.is_featured}
                          onCheckedChange={() => handleToggleFeatured(game)}
                        />
                      </TableCell>
                      <TableCell>{game.play_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedGame(game);
                              setEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(game.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredGames && filteredGames.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Mostrando 50 de {filteredGames.length} jogos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Jogo</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedGame.image && (
                  <img
                    src={selectedGame.image}
                    alt={selectedGame.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedGame.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedGame.external_code}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={selectedGame.name}
                  onChange={(e) =>
                    setSelectedGame({ ...selectedGame, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>RTP (%)</Label>
                  <Input
                    type="number"
                    value={selectedGame.rtp || ""}
                    onChange={(e) =>
                      setSelectedGame({ ...selectedGame, rtp: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aposta Mín</Label>
                  <Input
                    type="number"
                    value={selectedGame.min_bet || ""}
                    onChange={(e) =>
                      setSelectedGame({ ...selectedGame, min_bet: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aposta Máx</Label>
                  <Input
                    type="number"
                    value={selectedGame.max_bet || ""}
                    onChange={(e) =>
                      setSelectedGame({ ...selectedGame, max_bet: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedGame.is_active}
                    onCheckedChange={(checked) =>
                      setSelectedGame({ ...selectedGame, is_active: checked })
                    }
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedGame.is_featured}
                    onCheckedChange={(checked) =>
                      setSelectedGame({ ...selectedGame, is_featured: checked })
                    }
                  />
                  <Label>Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedGame.is_new}
                    onCheckedChange={(checked) =>
                      setSelectedGame({ ...selectedGame, is_new: checked })
                    }
                  />
                  <Label>Novo</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Games;
