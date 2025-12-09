import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Trash2, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Notifications = () => {
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const createNotification = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("notifications").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notificação enviada!");
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notificação excluída!");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    action_url: "",
    target: "all",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.target === "all") {
        // Get all user IDs and create notifications
        const { data: profiles } = await supabase.from("profiles").select("user_id");
        if (profiles) {
          const notifications = profiles.map((p) => ({
            user_id: p.user_id,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            action_url: formData.action_url || null,
          }));
          await createNotification.mutateAsync(notifications);
        }
      }
      setIsDialogOpen(false);
      setFormData({
        title: "",
        message: "",
        type: "info",
        action_url: "",
        target: "all",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "error": return "❌";
      default: return "ℹ️";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notificações</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notificação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Notificação</DialogTitle>
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
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informação</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target">Destinatário</Label>
                    <Select
                      value={formData.target}
                      onValueChange={(value) => setFormData({ ...formData, target: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Usuários</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action_url">URL de Ação (opcional)</Label>
                  <Input
                    id="action_url"
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createNotification.isPending}>
                  {createNotification.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Bell className="h-4 w-4 mr-2" />
                  Enviar Notificação
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications?.map((notification: any) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-xl">{getTypeIcon(notification.type)}</TableCell>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {notification.message}
                    </TableCell>
                    <TableCell>{notification.profiles?.name || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${notification.is_read ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>
                        {notification.is_read ? "Lida" : "Não lida"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteNotification.mutate(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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

export default Notifications;
