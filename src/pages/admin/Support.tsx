import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Support = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: replies } = useQuery({
    queryKey: ["ticket-replies", selectedTicket?.id],
    enabled: !!selectedTicket,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_replies")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Status atualizado!");
    },
  });

  const sendReply = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase.from("support_replies").insert({
        ticket_id: ticketId,
        message,
        is_staff: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-replies", selectedTicket?.id] });
      setReplyMessage("");
      toast.success("Resposta enviada!");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500/20 text-yellow-500";
      case "in_progress": return "bg-blue-500/20 text-blue-500";
      case "resolved": return "bg-green-500/20 text-green-500";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "normal": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Suporte</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.profiles?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{ticket.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(ticket.priority) as any}>
                        {ticket.priority === "urgent" ? "Urgente" : 
                         ticket.priority === "high" ? "Alta" : 
                         ticket.priority === "normal" ? "Normal" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => updateTicketStatus.mutate({ id: ticket.id, status: value })}
                      >
                        <SelectTrigger className="w-32">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status === "open" ? "Aberto" :
                             ticket.status === "in_progress" ? "Em Andamento" :
                             ticket.status === "resolved" ? "Resolvido" : "Fechado"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Original message */}
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{selectedTicket?.profiles?.name}</span>
                  <span className="text-muted-foreground">
                    {selectedTicket && format(new Date(selectedTicket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm">{selectedTicket?.message}</p>
              </div>

              {/* Replies */}
              {replies?.map((reply: any) => (
                <div 
                  key={reply.id} 
                  className={`p-4 rounded-lg ${reply.is_staff ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
                >
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{reply.is_staff ? "Suporte" : "Usuário"}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(reply.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{reply.message}</p>
                </div>
              ))}
            </div>

            {/* Reply form */}
            <div className="border-t pt-4 space-y-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={3}
              />
              <Button
                onClick={() => sendReply.mutate({ ticketId: selectedTicket.id, message: replyMessage })}
                disabled={!replyMessage.trim() || sendReply.isPending}
              >
                {sendReply.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar Resposta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Support;
