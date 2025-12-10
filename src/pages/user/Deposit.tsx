import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Copy, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Deposit = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  const handleDeposit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 10) {
      toast.error("Valor mínimo de depósito é R$ 10,00");
      return;
    }

    if (depositAmount > 50000) {
      toast.error("Valor máximo de depósito é R$ 50.000,00");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: deposit, error } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount: depositAmount,
          status: "pending",
          pix_code: `PIX${Date.now()}${Math.random().toString(36).substring(7)}`.toUpperCase(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setPixCode(deposit.pix_code);
      toast.success("PIX gerado com sucesso!");
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error("Erro ao gerar PIX: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast.success("Código PIX copiado!");
    }
  };

  if (isLoading) {
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
      <div className="max-w-lg mx-auto space-y-6">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/wallet")}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground">Depositar</h1>

        {!pixCode ? (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Valor do Depósito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 bg-secondary border-border text-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  Mínimo: R$ 10,00 | Máximo: R$ 50.000,00
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    className="h-12 border-border text-foreground hover:bg-secondary"
                    onClick={() => setAmount(value.toString())}
                  >
                    R$ {value}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full h-14 text-lg gradient-accent text-accent-foreground"
                onClick={handleDeposit}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <CheckCircle className="w-5 h-5" />
                PIX Gerado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary rounded-lg p-6 text-center">
                <QrCode className="w-32 h-32 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Escaneie o QR Code ou copie o código
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Código PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixCode}
                    readOnly
                    className="font-mono text-sm bg-secondary border-border text-foreground"
                  />
                  <Button variant="outline" size="icon" onClick={copyPixCode} className="border-border">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-casino-gold/10 rounded-lg border border-casino-gold/30">
                <p className="font-semibold text-casino-gold">
                  Valor: R$ {parseFloat(amount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  O PIX expira em 30 minutos
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setPixCode(null)}
                >
                  Novo Depósito
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate("/wallet")}
                >
                  Voltar à Carteira
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-secondary/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-foreground">Como funciona:</h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li>1. Digite o valor desejado</li>
              <li>2. Clique em "Gerar PIX"</li>
              <li>3. Copie o código ou escaneie o QR Code</li>
              <li>4. Pague no app do seu banco</li>
              <li>5. Saldo creditado em segundos!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deposit;