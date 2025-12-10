import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Loader2, Gamepad2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Transactions = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["user-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "deposit":
        return { label: "Depósito", icon: ArrowDownLeft, color: "text-accent" };
      case "withdrawal":
        return { label: "Saque", icon: ArrowUpRight, color: "text-primary" };
      case "bet":
        return { label: "Aposta", icon: Gamepad2, color: "text-destructive" };
      case "win":
        return { label: "Ganho", icon: Gamepad2, color: "text-casino-gold" };
      case "bonus":
        return { label: "Bônus", icon: ArrowDownLeft, color: "text-casino-purple" };
      case "refund":
        return { label: "Reembolso", icon: ArrowDownLeft, color: "text-accent" };
      default:
        return { label: type, icon: ArrowDownLeft, color: "text-muted-foreground" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent text-accent-foreground">Concluído</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/wallet")}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground">Histórico de Transações</h1>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Últimas transações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transactions?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions?.map((transaction) => {
                  const typeInfo = getTypeInfo(transaction.type);
                  const Icon = typeInfo.icon;
                  const isPositive = ["deposit", "win", "bonus", "refund"].includes(transaction.type);
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full bg-background ${typeInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{typeInfo.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at!), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isPositive ? "text-accent" : "text-destructive"}`}>
                          {isPositive ? "+" : "-"} R$ {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        {getStatusBadge(transaction.status || "pending")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;