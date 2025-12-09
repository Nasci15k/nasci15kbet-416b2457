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
import { Plus, Edit, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

const PaymentMethods = () => {
  const queryClient = useQueryClient();
  
  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMethod = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("payment_methods").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Método criado!");
    },
  });

  const updateMethod = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from("payment_methods").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Método atualizado!");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "pix",
    icon: "",
    min_deposit: 10,
    max_deposit: 50000,
    min_withdrawal: 20,
    max_withdrawal: 10000,
    deposit_fee_percent: 0,
    withdrawal_fee_percent: 0,
    processing_time: "Instantâneo",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "pix",
      icon: "",
      min_deposit: 10,
      max_deposit: 50000,
      min_withdrawal: 20,
      max_withdrawal: 10000,
      deposit_fee_percent: 0,
      withdrawal_fee_percent: 0,
      processing_time: "Instantâneo",
      is_active: true,
    });
    setEditingMethod(null);
  };

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      icon: method.icon || "",
      min_deposit: method.min_deposit || 10,
      max_deposit: method.max_deposit || 50000,
      min_withdrawal: method.min_withdrawal || 20,
      max_withdrawal: method.max_withdrawal || 10000,
      deposit_fee_percent: method.deposit_fee_percent || 0,
      withdrawal_fee_percent: method.withdrawal_fee_percent || 0,
      processing_time: method.processing_time || "Instantâneo",
      is_active: method.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        await updateMethod.mutateAsync({ id: editingMethod.id, ...formData });
      } else {
        await createMethod.mutateAsync(formData);
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
          <h1 className="text-2xl font-bold">Métodos de Pagamento</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? "Editar Método" : "Novo Método"}
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
                    <Label htmlFor="type">Tipo</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_deposit">Depósito Mínimo</Label>
                    <Input
                      id="min_deposit"
                      type="number"
                      value={formData.min_deposit}
                      onChange={(e) => setFormData({ ...formData, min_deposit: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_deposit">Depósito Máximo</Label>
                    <Input
                      id="max_deposit"
                      type="number"
                      value={formData.max_deposit}
                      onChange={(e) => setFormData({ ...formData, max_deposit: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_withdrawal">Saque Mínimo</Label>
                    <Input
                      id="min_withdrawal"
                      type="number"
                      value={formData.min_withdrawal}
                      onChange={(e) => setFormData({ ...formData, min_withdrawal: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_withdrawal">Saque Máximo</Label>
                    <Input
                      id="max_withdrawal"
                      type="number"
                      value={formData.max_withdrawal}
                      onChange={(e) => setFormData({ ...formData, max_withdrawal: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit_fee">Taxa Depósito (%)</Label>
                    <Input
                      id="deposit_fee"
                      type="number"
                      step="0.1"
                      value={formData.deposit_fee_percent}
                      onChange={(e) => setFormData({ ...formData, deposit_fee_percent: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal_fee">Taxa Saque (%)</Label>
                    <Input
                      id="withdrawal_fee"
                      type="number"
                      step="0.1"
                      value={formData.withdrawal_fee_percent}
                      onChange={(e) => setFormData({ ...formData, withdrawal_fee_percent: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processing_time">Tempo de Processamento</Label>
                  <Input
                    id="processing_time"
                    value={formData.processing_time}
                    onChange={(e) => setFormData({ ...formData, processing_time: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMethod.isPending || updateMethod.isPending}>
                  {(createMethod.isPending || updateMethod.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMethod ? "Salvar" : "Criar"}
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
            {methods?.map((method) => (
              <Card key={method.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {method.name}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(method)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium uppercase">{method.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Depósito</span>
                    <span>R$ {method.min_deposit} - R$ {method.max_deposit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saque</span>
                    <span>R$ {method.min_withdrawal} - R$ {method.max_withdrawal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processamento</span>
                    <span>{method.processing_time}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className={`px-2 py-1 rounded-full text-xs ${method.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                      {method.is_active ? "Ativo" : "Inativo"}
                    </span>
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

export default PaymentMethods;
