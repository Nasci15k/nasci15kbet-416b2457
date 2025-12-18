import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Check, X, Camera, FileText, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface KYCDocument {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejected_reason: string | null;
  created_at: string;
}

const KYCVerification = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch user's KYC documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["user-kyc-documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as KYCDocument[];
    },
    enabled: !!user?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from("kyc_documents")
        .insert({
          user_id: user.id,
          document_type: type,
          document_url: publicUrl,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Update profile KYC status
      await supabase
        .from("profiles")
        .update({ kyc_status: "pending" })
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-kyc-documents"] });
      toast.success("Documento enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao enviar: " + error.message);
    },
  });

  const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.");
      return;
    }

    setUploading(type);
    try {
      await uploadMutation.mutateAsync({ file, type });
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (type: string) => {
    const doc = documents?.find((d) => d.document_type === type);
    return doc;
  };

  const renderDocumentCard = (
    type: string,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => {
    const doc = getDocStatus(type);
    const isUploading = uploading === type;

    return (
      <Card className={doc?.status === "rejected" ? "border-destructive" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted">{icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              
              {doc ? (
                <div className="mt-3">
                  {doc.status === "pending" && (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Em análise
                    </Badge>
                  )}
                  {doc.status === "approved" && (
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                  {doc.status === "rejected" && (
                    <div className="space-y-2">
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Rejeitado
                      </Badge>
                      {doc.rejected_reason && (
                        <p className="text-sm text-destructive">{doc.rejected_reason}</p>
                      )}
                      <label className="block">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(type, e)}
                          disabled={isUploading}
                        />
                        <Button variant="outline" size="sm" asChild disabled={isUploading}>
                          <span>
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Enviar novamente
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <label className="block mt-3">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(type, e)}
                    disabled={isUploading}
                  />
                  <Button variant="outline" asChild disabled={isUploading}>
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Enviar documento
                    </span>
                  </Button>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const allApproved = ["id_front", "id_back", "selfie"].every(
    (type) => getDocStatus(type)?.status === "approved"
  );

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Verificação KYC</h1>
            <p className="text-muted-foreground">
              Verifique sua identidade para poder realizar saques
            </p>
          </div>
        </div>

        {allApproved ? (
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-green-500">
                <Check className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Verificação Completa!</p>
                  <p className="text-sm opacity-80">
                    Sua conta está verificada e você pode realizar saques.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Verificação Necessária</p>
                  <p className="text-sm text-muted-foreground">
                    Para realizar saques, você precisa verificar sua identidade enviando os
                    documentos abaixo. Os saques só podem ser feitos para o CPF, email ou
                    telefone cadastrados na sua conta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {renderDocumentCard(
            "id_front",
            "Documento de Identidade (Frente)",
            "RG, CNH ou outro documento oficial com foto",
            <FileText className="h-6 w-6" />
          )}
          
          {renderDocumentCard(
            "id_back",
            "Documento de Identidade (Verso)",
            "Verso do documento com dados legíveis",
            <FileText className="h-6 w-6" />
          )}
          
          {renderDocumentCard(
            "selfie",
            "Selfie com Documento",
            "Foto segurando o documento ao lado do rosto",
            <Camera className="h-6 w-6" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Os documentos devem estar legíveis e sem cortes</p>
            <p>• Aceitamos RG, CNH, Passaporte ou Carteira de Trabalho</p>
            <p>• A selfie deve mostrar seu rosto e o documento claramente</p>
            <p>• Formatos aceitos: JPG, PNG, WebP ou PDF (máx. 5MB)</p>
            <p>• A análise é feita em até 24 horas úteis</p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default KYCVerification;