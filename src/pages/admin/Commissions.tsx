import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Commissions = () => {
  const queryClient = useQueryClient();
  
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("*, affiliates(code, profiles:user_id(name, email))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const payCommission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affiliate_commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Comissão marcada como paga!");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-500";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Comissões de Afiliados</h1>
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
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.map((commission: any) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{commission.affiliates?.profiles?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{commission.affiliates?.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">{commission.affiliates?.code}</code>
                    </TableCell>
                    <TableCell className="capitalize">{commission.type}</TableCell>
                    <TableCell className="text-green-500 font-medium">
                      R$ {Number(commission.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(commission.status)}`}>
                        {commission.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(commission.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {commission.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-500"
                          onClick={() => payCommission.mutate(commission.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {commissions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma comissão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Commissions;
