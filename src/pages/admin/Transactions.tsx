import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Transactions = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, profiles:user_id(name, email), games(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: "Depósito",
      withdrawal: "Saque",
      bet: "Aposta",
      win: "Ganho",
      bonus: "Bônus",
      refund: "Reembolso",
      adjustment: "Ajuste",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "win":
      case "bonus":
      case "refund":
        return "text-green-500";
      case "withdrawal":
      case "bet":
        return "text-red-500";
      default:
        return "text-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-500";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
      case "failed": return "bg-red-500/20 text-red-500";
      case "cancelled": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transações</h1>

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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Saldo Antes</TableHead>
                  <TableHead>Saldo Depois</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.profiles?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{transaction.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type === "bet" || transaction.type === "withdrawal" ? "-" : "+"}
                      R$ {Math.abs(Number(transaction.amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.balance_before != null ? `R$ ${Number(transaction.balance_before).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.balance_after != null ? `R$ ${Number(transaction.balance_after).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.games?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                        {transaction.status === "completed" ? "Concluído" :
                         transaction.status === "pending" ? "Pendente" :
                         transaction.status === "failed" ? "Falhou" : "Cancelado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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

export default Transactions;
