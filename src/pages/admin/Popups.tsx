import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Popups = () => {
  const queryClient = useQueryClient();
  
  const { data: popups, isLoading } = useQuery({
    queryKey: ["popups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createPopup = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("popups").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup criado!");
    },
  });

  const updatePopup = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from("popups").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup atualizado!");
    },
  });

  const deletePopup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast.success("Popup excluído!");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    button_text: "",
    button_url: "",
    trigger_type: "on_load",
    delay_seconds: 0,
    show_once: true,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image: "",
      button_text: "",
      button_url: "",
      trigger_type: "on_load",
      delay_seconds: 0,
      show_once: true,
      is_active: true,
    });
    setEditingPopup(null);
  };

  const handleEdit = (popup: any) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      content: popup.content || "",
      image: popup.image || "",
      button_text: popup.button_text || "",
      button_url: popup.button_url || "",
      trigger_type: popup.trigger_type || "on_load",
      delay_seconds: popup.delay_seconds || 0,
      show_once: popup.show_once ?? true,
      is_active: popup.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPopup) {
        await updatePopup.mutateAsync({ id: editingPopup.id, ...formData });
      } else {
        await createPopup.mutateAsync(formData);
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
          <h1 className="text-2xl font-bold">Popups</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Popup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPopup ? "Editar Popup" : "Novo Popup"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">URL da Imagem</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button_text">Texto do Botão</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button_url">URL do Botão</Label>
                    <Input
                      id="button_url"
                      value={formData.button_url}
                      onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger_type">Gatilho</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_load">Ao Carregar</SelectItem>
                        <SelectItem value="on_exit">Ao Sair</SelectItem>
                        <SelectItem value="on_scroll">Ao Rolar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delay_seconds">Delay (segundos)</Label>
                    <Input
                      id="delay_seconds"
                      type="number"
                      min="0"
                      value={formData.delay_seconds}
                      onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar apenas uma vez</Label>
                    <Switch
                      checked={formData.show_once}
                      onCheckedChange={(checked) => setFormData({ ...formData, show_once: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ativo</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createPopup.isPending || updatePopup.isPending}>
                  {(createPopup.isPending || updatePopup.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPopup ? "Salvar" : "Criar"}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popups?.map((popup) => (
              <Card key={popup.id}>
                {popup.image && (
                  <img
                    src={popup.image}
                    alt={popup.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{popup.title}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs ${popup.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {popup.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {popup.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {popup.content}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="px-2 py-1 bg-muted rounded">
                      {popup.trigger_type === "on_load" ? "Ao carregar" : 
                       popup.trigger_type === "on_exit" ? "Ao sair" : "Ao rolar"}
                    </span>
                    {popup.delay_seconds > 0 && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {popup.delay_seconds}s delay
                      </span>
                    )}
                    {popup.show_once && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Uma vez
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(popup)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deletePopup.mutate(popup.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Popups;
