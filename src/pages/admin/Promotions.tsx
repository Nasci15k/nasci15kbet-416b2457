import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { format } from "date-fns";

const Promotions = () => {
  const queryClient = useQueryClient();
  
  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const createPromotion = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("promotions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promoção criada!");
    },
  });

  const updatePromotion = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from("promotions").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promoção atualizada!");
    },
  });

  const deletePromotion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promoção excluída!");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    type: "general",
    terms: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      type: "general",
      terms: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      image: promotion.image || "",
      type: promotion.type || "general",
      terms: promotion.terms || "",
      start_date: promotion.start_date ? format(new Date(promotion.start_date), "yyyy-MM-dd") : "",
      end_date: promotion.end_date ? format(new Date(promotion.end_date), "yyyy-MM-dd") : "",
      is_active: promotion.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    try {
      if (editingPromotion) {
        await updatePromotion.mutateAsync({ id: editingPromotion.id, ...data });
      } else {
        await createPromotion.mutateAsync(data);
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
          <h1 className="text-2xl font-bold">Promoções</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? "Editar Promoção" : "Nova Promoção"}
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
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <Label htmlFor="start_date">Data Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data Fim</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Termos</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativa</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createPromotion.isPending || updatePromotion.isPending}>
                  {(createPromotion.isPending || updatePromotion.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPromotion ? "Salvar" : "Criar"}
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
            {promotions?.map((promotion) => (
              <Card key={promotion.id}>
                {promotion.image && (
                  <img
                    src={promotion.image}
                    alt={promotion.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{promotion.title}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs ${promotion.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {promotion.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {promotion.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {promotion.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(promotion)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deletePromotion.mutate(promotion.id)}
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

export default Promotions;
