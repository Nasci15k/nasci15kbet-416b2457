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
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const Affiliates = () => {
  const queryClient = useQueryClient();
  
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveAffiliate = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      toast.success("Status atualizado!");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Afiliados</h1>
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
                  <TableHead>Cliques</TableHead>
                  <TableHead>Cadastros</TableHead>
                  <TableHead>Depósitos</TableHead>
                  <TableHead>Comissão Total</TableHead>
                  <TableHead>Pendente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates?.map((affiliate: any) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.profiles?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">{affiliate.code}</code>
                    </TableCell>
                    <TableCell>{affiliate.total_clicks}</TableCell>
                    <TableCell>{affiliate.total_signups}</TableCell>
                    <TableCell>R$ {Number(affiliate.total_deposits).toFixed(2)}</TableCell>
                    <TableCell className="text-green-500">
                      R$ {Number(affiliate.total_commission).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-yellow-500">
                      R$ {Number(affiliate.pending_commission).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={affiliate.is_approved ? "default" : "secondary"}>
                        {affiliate.is_approved ? "Aprovado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!affiliate.is_approved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500"
                            onClick={() => approveAffiliate.mutate({ id: affiliate.id, approved: true })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {affiliate.is_approved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => approveAffiliate.mutate({ id: affiliate.id, approved: false })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {affiliates?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum afiliado cadastrado
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

export default Affiliates;
