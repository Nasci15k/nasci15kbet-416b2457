import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/casino/Header";
import { Sidebar } from "@/components/casino/Sidebar";
import { HeroBanner } from "@/components/casino/HeroBanner";
import { CategoryFilter } from "@/components/casino/CategoryFilter";
import { SearchBar } from "@/components/casino/SearchBar";
import { GamesGrid } from "@/components/casino/GamesGrid";
import { WinnersSection } from "@/components/casino/WinnersSection";
import { GameModal } from "@/components/casino/GameModal";
import { mockWinners } from "@/data/mockData";
import { Game } from "@/types/casino";
import { useGames, useGameProviders, useGameCategories } from "@/hooks/useGames";
import { useLaunchGame } from "@/hooks/usePlayfivers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameUrl, setGameUrl] = useState<string | null>(null);

  const { data: dbGames, isLoading: gamesLoading } = useGames(
    activeCategory !== "all" ? activeCategory : undefined,
    undefined,
    searchQuery || undefined
  );
  const { data: providers } = useGameProviders();
  const { data: categories } = useGameCategories();
  const launchGame = useLaunchGame();

  const isLoggedIn = !!user;
  const balance = profile?.balance || 0;

  // Transform DB games to match Game type
  const games = useMemo((): Game[] => {
    if (!dbGames) return [];
    
    return dbGames.map((game) => {
      const provider = providers?.find((p) => p.id === game.provider_id);
      return {
        id: game.id,
        code: game.external_code,
        name: game.name,
        image: game.image || "https://placehold.co/300x200/1a1a2e/ffffff?text=" + encodeURIComponent(game.name),
        provider: provider?.name || "Unknown",
        providerId: game.provider_id || "",
        category: categories?.find((c) => c.id === game.category_id)?.slug || "slots",
        isNew: game.is_new,
        isLive: game.is_live,
        isOriginal: game.is_original,
        isFeatured: game.is_featured,
        rtp: game.rtp || 96,
        minBet: game.min_bet || 0.1,
        maxBet: game.max_bet || 1000,
        externalCode: game.external_code,
      };
    });
  }, [dbGames, providers, categories]);

  const filteredGames = useMemo(() => {
    let result = games;

    if (activeCategory !== "all") {
      result = result.filter((game) => {
        if (activeCategory === "live") return game.isLive;
        return game.category === activeCategory;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (game) =>
          game.name.toLowerCase().includes(query) ||
          game.provider.toLowerCase().includes(query)
      );
    }

    return result;
  }, [games, activeCategory, searchQuery]);

  const handlePlayGame = async (game: Game) => {
    if (!isLoggedIn) {
      toast.error("Faça login para jogar");
      navigate("/auth");
      return;
    }

    setSelectedGame(game);
    setIsGameModalOpen(true);
    setGameUrl(null);
    
    toast.info(`Carregando ${game.name}...`);

    try {
      const result = await launchGame.mutateAsync({
        gameCode: game.externalCode || game.code || game.id,
        userId: user.id,
      });

      if (result?.game_url) {
        setGameUrl(result.game_url);
        toast.success("Jogo carregado!");
      } else {
        toast.error("URL do jogo não disponível");
      }
    } catch (error) {
      console.error("Error launching game:", error);
    }
  };

  const handleDeposit = () => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    navigate("/deposit");
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        balance={balance}
        isLoggedIn={isLoggedIn}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogin={handleLogin}
        onDeposit={handleDeposit}
      />

      <Sidebar
        isOpen={sidebarOpen}
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSidebarOpen(false);
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 lg:pl-64">
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
          <HeroBanner />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <WinnersSection winners={mockWinners} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {activeCategory === "all" ? "Todos os Jogos" : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace("-", " ")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredGames.length} jogos
              </span>
            </div>
            {gamesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum jogo encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure a API e sincronize os jogos no painel administrativo
                </p>
              </div>
            ) : (
              <GamesGrid games={filteredGames} onPlayGame={handlePlayGame} />
            )}
          </div>
        </div>
      </main>

      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        game={selectedGame}
        gameUrl={gameUrl}
      />
    </div>
  );
};

export default Index;
