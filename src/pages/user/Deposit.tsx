import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateDeposit, useCheckDepositStatus } from "@/hooks/useS6XPay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Copy, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const Deposit = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isLoading } = useAuth();
  
  const [amount, setAmount] = useState("");
  const [depositData, setDepositData] = useState<{
    id: string;
    pix_code: string;
    qr_code_base64: string;
    expires_at: string;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const createDeposit = useCreateDeposit();
  const checkStatus = useCheckDepositStatus();

  const quickAmounts = [20, 50, 100, 200, 500, 800];

  // Auto-check deposit status every 10 seconds
  useEffect(() => {
    if (!depositData) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkStatus.mutateAsync(depositData.id);
        if (result.status === "completed") {
          toast.success("Depósito confirmado! Saldo atualizado.");
          await refreshProfile();
          setDepositData(null);
          setAmount("");
        } else if (result.status === "failed" || result.status === "expired") {
          toast.error("Depósito expirado. Gere um novo PIX.");
          setDepositData(null);
        }
      } catch (error) {
        console.error("Error checking deposit status:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [depositData, checkStatus, refreshProfile]);

  const handleDeposit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 8) {
      toast.error("Valor mínimo de depósito é R$ 8,00");
      return;
    }

    if (depositAmount > 899) {
      toast.error("Valor máximo de depósito é R$ 899,00");
      return;
    }

    try {
      const result = await createDeposit.mutateAsync({ amount: depositAmount });
      setDepositData(result.deposit);
      toast.success("PIX gerado com sucesso!");
    } catch (error: any) {
      console.error("Deposit error:", error);
    }
  };

  const handleCheckStatus = async () => {
    if (!depositData) return;
    
    setIsCheckingStatus(true);
    try {
      const result = await checkStatus.mutateAsync(depositData.id);
      if (result.status === "completed") {
        toast.success("Depósito confirmado! Saldo atualizado.");
        await refreshProfile();
        setDepositData(null);
        setAmount("");
      } else if (result.status === "failed" || result.status === "expired") {
        toast.error("Depósito expirado. Gere um novo PIX.");
        setDepositData(null);
      } else {
        toast.info("Aguardando pagamento...");
      }
    } catch (error: any) {
      console.error("Check status error:", error);
      toast.error("Erro ao verificar status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const copyPixCode = () => {
    if (depositData?.pix_code) {
      navigator.clipboard.writeText(depositData.pix_code);
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
    return <Navigate to="/auth" replace />;
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

        {!depositData ? (
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
                  Mínimo: R$ 8,00 | Máximo: R$ 899,00
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
                disabled={createDeposit.isPending || !amount}
              >
                {createDeposit.isPending ? (
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
                {depositData.qr_code_base64 ? (
                  <img 
                    src={`data:image/png;base64,${depositData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto mb-4"
                  />
                ) : (
                  <QrCode className="w-32 h-32 mx-auto mb-4 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  Escaneie o QR Code ou copie o código
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Código PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={depositData.pix_code}
                    readOnly
                    className="font-mono text-xs bg-secondary border-border text-foreground"
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

              <Button
                variant="outline"
                className="w-full"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Já paguei, verificar status
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => {
                    setDepositData(null);
                    setAmount("");
                  }}
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
              <li>1. Digite o valor desejado (R$ 8 a R$ 899)</li>
              <li>2. Clique em "Gerar PIX"</li>
              <li>3. Copie o código ou escaneie o QR Code</li>
              <li>4. Pague no app do seu banco</li>
              <li>5. Saldo creditado automaticamente!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deposit;
