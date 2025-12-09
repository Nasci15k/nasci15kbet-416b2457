import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useGameProviders, useCreateProvider, useUpdateProvider } from "@/hooks/useGames";
import { Plus, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Providers = () => {
  const { data: providers, isLoading } = useGameProviders();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
    external_id: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      logo: "",
      external_id: "",
      is_active: true,
    });
    setEditingProvider(null);
  };

  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      slug: provider.slug,
      logo: provider.logo || "",
      external_id: provider.external_id?.toString() || "",
      is_active: provider.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
      logo: formData.logo || null,
      external_id: formData.external_id ? parseInt(formData.external_id) : null,
      is_active: formData.is_active,
    };

    try {
      if (editingProvider) {
        await updateProvider.mutateAsync({ id: editingProvider.id, ...data });
      } else {
        await createProvider.mutateAsync(data);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Provedores de Jogos</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Provedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? "Editar Provedor" : "Novo Provedor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Gerado automaticamente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external_id">ID Externo (Playfivers)</Label>
                  <Input
                    id="external_id"
                    type="number"
                    value={formData.external_id}
                    onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">URL do Logo</Label>
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createProvider.isPending || updateProvider.isPending}>
                  {(createProvider.isPending || updateProvider.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProvider ? "Salvar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>ID Externo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers?.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      {provider.logo ? (
                        <img src={provider.logo} alt={provider.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                          {provider.name.charAt(0)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="text-muted-foreground">{provider.slug}</TableCell>
                    <TableCell>{provider.external_id || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${provider.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                        {provider.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Providers;
