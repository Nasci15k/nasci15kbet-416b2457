import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

const VIP = () => {
  const queryClient = useQueryClient();
  
  const { data: levels, isLoading } = useQuery({
    queryKey: ["vip-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_levels")
        .select("*")
        .order("level");
      if (error) throw error;
      return data;
    },
  });

  const updateLevel = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const { error } = await supabase
        .from("vip_levels")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-levels"] });
      toast.success("Nível atualizado!");
    },
  });

  const createLevel = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("vip_levels").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-levels"] });
      toast.success("Nível criado!");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: 0,
    min_points: 0,
    cashback_percent: 0,
    color: "#F59E0B",
    icon: "👑",
    dedicated_support: false,
    withdrawal_priority: false,
    special_bonuses: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      level: (levels?.length || 0) + 1,
      min_points: 0,
      cashback_percent: 0,
      color: "#F59E0B",
      icon: "👑",
      dedicated_support: false,
      withdrawal_priority: false,
      special_bonuses: false,
    });
    setEditingLevel(null);
  };

  const handleEdit = (level: any) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      level: level.level,
      min_points: level.min_points,
      cashback_percent: level.cashback_percent || 0,
      color: level.color || "#F59E0B",
      icon: level.icon || "👑",
      dedicated_support: level.dedicated_support || false,
      withdrawal_priority: level.withdrawal_priority || false,
      special_bonuses: level.special_bonuses || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLevel) {
        await updateLevel.mutateAsync({ id: editingLevel.id, ...formData });
      } else {
        await createLevel.mutateAsync(formData);
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
          <h1 className="text-2xl font-bold">Níveis VIP</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Nível
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLevel ? "Editar Nível" : "Novo Nível"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="level">Nível</Label>
                    <Input
                      id="level"
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_points">Pontos Mínimos</Label>
                    <Input
                      id="min_points"
                      type="number"
                      value={formData.min_points}
                      onChange={(e) => setFormData({ ...formData, min_points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashback">Cashback %</Label>
                    <Input
                      id="cashback"
                      type="number"
                      step="0.1"
                      value={formData.cashback_percent}
                      onChange={(e) => setFormData({ ...formData, cashback_percent: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Ícone</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="👑"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Suporte Dedicado</Label>
                    <Switch
                      checked={formData.dedicated_support}
                      onCheckedChange={(checked) => setFormData({ ...formData, dedicated_support: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Prioridade em Saques</Label>
                    <Switch
                      checked={formData.withdrawal_priority}
                      onCheckedChange={(checked) => setFormData({ ...formData, withdrawal_priority: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Bônus Especiais</Label>
                    <Switch
                      checked={formData.special_bonuses}
                      onCheckedChange={(checked) => setFormData({ ...formData, special_bonuses: checked })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={updateLevel.isPending || createLevel.isPending}>
                  {(updateLevel.isPending || createLevel.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingLevel ? "Salvar" : "Criar"}
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
            {levels?.map((level) => (
              <Card key={level.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: level.color || "#F59E0B" }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{level.icon || "👑"}</span>
                    {level.name}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(level)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nível</span>
                    <span className="font-medium">{level.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pontos Mínimos</span>
                    <span className="font-medium">{level.min_points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cashback</span>
                    <span className="font-medium text-green-500">{level.cashback_percent}%</span>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    {level.dedicated_support && (
                      <span className="inline-block px-2 py-1 text-xs bg-primary/20 text-primary rounded mr-1">
                        Suporte VIP
                      </span>
                    )}
                    {level.withdrawal_priority && (
                      <span className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded mr-1">
                        Saque Prioritário
                      </span>
                    )}
                    {level.special_bonuses && (
                      <span className="inline-block px-2 py-1 text-xs bg-purple-500/20 text-purple-500 rounded">
                        Bônus Especiais
                      </span>
                    )}
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

export default VIP;
