import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Wallet, User, LogIn, LogOut, Settings, CreditCard, History, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  balance: number;
  isLoggedIn: boolean;
  onMenuToggle: () => void;
  onLogin: () => void;
  onDeposit: () => void;
}

export const Header = ({ balance, isLoggedIn, onMenuToggle, onLogin, onDeposit }: HeaderProps) => {
  const navigate = useNavigate();
  const { signOut, profile, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-foreground">Nasci</span>
              <span className="text-xl font-bold text-primary">15k</span>
              <span className="text-xl font-bold text-accent">Bet</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            <Button variant="ghost" className="text-foreground font-medium">
              <span className="flex items-center gap-2">
                🎰 CASSINO
              </span>
            </Button>
            <Button variant="ghost" className="text-muted-foreground font-medium">
              <span className="flex items-center gap-2">
                ⚽ ESPORTES
              </span>
            </Button>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  R$ {balance.toFixed(2)}
                </span>
              </div>
              
              <Button variant="deposit" size="default" onClick={onDeposit}>
                Depositar
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-secondary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{profile?.name || "Usuário"}</span>
                      <span className="text-xs text-muted-foreground">{profile?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wallet")}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Carteira
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/deposit")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Depositar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/withdraw")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Sacar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/transactions")}>
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Crown className="h-4 w-4 mr-2" />
                        Painel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button variant="deposit" onClick={onLogin}>
                Cadastrar
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
