import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Eye, ShieldCheck, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejected_reason: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    cpf: string;
  };
}

const KYCPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Fetch KYC documents with profile info
  const { data: documents, isLoading } = useQuery({
    queryKey: ["kyc-documents"],
    queryFn: async () => {
      const { data: docs, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(docs?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, cpf")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return (docs || []).map(d => ({
        ...d,
        profiles: profileMap.get(d.user_id)
      })) as KYCDocument[];
    },
  });

  // Group documents by user
  const documentsByUser = documents?.reduce((acc, doc) => {
    if (!acc[doc.user_id]) {
      acc[doc.user_id] = [];
    }
    acc[doc.user_id].push(doc);
    return acc;
  }, {} as Record<string, KYCDocument[]>);

  // Approve document
  const approveMutation = useMutation({
    mutationFn: async (docId: string) => {
      const doc = documents?.find((d) => d.id === docId);
      if (!doc) throw new Error("Documento não encontrado");

      const { error } = await supabase
        .from("kyc_documents")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", docId);
      
      if (error) throw error;

      // Check if all user docs are approved
      const userDocs = documents?.filter((d) => d.user_id === doc.user_id);
      const allApproved = userDocs?.every(
        (d) => d.id === docId || d.status === "approved"
      );

      if (allApproved) {
        await supabase
          .from("profiles")
          .update({
            kyc_status: "approved",
            kyc_approved_at: new Date().toISOString(),
            kyc_approved_by: user?.id,
          })
          .eq("user_id", doc.user_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-documents"] });
      toast.success("Documento aprovado!");
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Reject document
  const rejectMutation = useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      const doc = documents?.find((d) => d.id === docId);
      if (!doc) throw new Error("Documento não encontrado");

      const { error } = await supabase
        .from("kyc_documents")
        .update({
          status: "rejected",
          rejected_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", docId);
      
      if (error) throw error;

      // Update profile status
      await supabase
        .from("profiles")
        .update({ kyc_status: "rejected" })
        .eq("user_id", doc.user_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-documents"] });
      toast.success("Documento rejeitado");
      setIsRejectOpen(false);
      setRejectReason("");
      setSelectedDoc(null);
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "id_front":
        return "Documento (Frente)";
      case "id_back":
        return "Documento (Verso)";
      case "selfie":
        return "Selfie";
      default:
        return type;
    }
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case "selfie":
        return <Camera className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const pendingCount = documents?.filter((d) => d.status === "pending").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Verificação KYC</h1>
              <p className="text-muted-foreground">
                {pendingCount} documento(s) pendente(s) de análise
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(documentsByUser || {}).map(([userId, userDocs]) => {
              const profile = userDocs[0]?.profiles;
              const hasPending = userDocs.some((d) => d.status === "pending");

              return (
                <Card key={userId} className={hasPending ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        <p className="text-sm text-muted-foreground">CPF: {profile?.cpf}</p>
                      </div>
                      {hasPending && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Aguardando análise
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDocs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="flex items-center gap-2">
                              {getDocTypeIcon(doc.document_type)}
                              {getDocTypeLabel(doc.document_type)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(doc.status)}
                              {doc.rejected_reason && (
                                <p className="text-xs text-destructive mt-1">
                                  {doc.rejected_reason}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(doc.document_url, "_blank")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {doc.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-green-500"
                                      onClick={() => approveMutation.mutate(doc.id)}
                                      disabled={approveMutation.isPending}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      onClick={() => {
                                        setSelectedDoc(doc);
                                        setIsRejectOpen(true);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}

            {(!documentsByUser || Object.keys(documentsByUser).length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum documento enviado para verificação
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe o motivo da rejeição. O usuário poderá enviar novamente.
              </p>
              <Textarea
                placeholder="Ex: Documento ilegível, foto cortada..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedDoc && rejectReason) {
                    rejectMutation.mutate({ docId: selectedDoc.id, reason: rejectReason });
                  }
                }}
                disabled={!rejectReason || rejectMutation.isPending}
              >
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default KYCPage;