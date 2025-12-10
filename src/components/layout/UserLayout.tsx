import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

interface UserLayoutProps {
  children: ReactNode;
  title: string;
  backTo?: string;
}

const UserLayout = ({ children, title, backTo = "/" }: UserLayoutProps) => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl font-bold text-foreground">{title}</h1>

          {children}
        </div>
      </div>
    </div>
  );
};

export default UserLayout;