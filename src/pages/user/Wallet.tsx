import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Gift, History, Loader2 } from "lucide-react";

const Wallet = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

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

  const balance = profile.balance || 0;
  const bonusBalance = profile.bonus_balance || 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground">Carteira</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-gradient-to-br from-primary/20 to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                R$ {balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-casino-gold/20 to-casino-gold/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Saldo Bônus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-casino-gold">
                R$ {bonusBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            className="h-auto py-6 flex flex-col items-center gap-2 gradient-accent text-accent-foreground"
            onClick={() => navigate("/deposit")}
          >
            <ArrowDownLeft className="w-8 h-8" />
            <span className="text-lg font-semibold">Depositar</span>
            <span className="text-sm opacity-80">PIX instantâneo</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2 border-primary/50 hover:bg-primary/10"
            onClick={() => navigate("/withdraw")}
          >
            <ArrowUpRight className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold text-foreground">Sacar</span>
            <span className="text-sm text-muted-foreground">Retirar fundos</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2 border-border hover:bg-secondary"
            onClick={() => navigate("/transactions")}
          >
            <History className="w-8 h-8 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">Histórico</span>
            <span className="text-sm text-muted-foreground">Ver transações</span>
          </Button>
        </div>

        {/* VIP Info */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Nível VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">Nível {profile.vip_level || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.vip_points || 0} pontos VIP
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Próximo nível</p>
                <p className="text-lg font-semibold text-primary">
                  {1000 - (profile.vip_points || 0)} pontos restantes
                </p>
              </div>
            </div>
            <div className="mt-4 bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all duration-500"
                style={{ width: `${((profile.vip_points || 0) / 1000) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;