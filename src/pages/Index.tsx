import { useState, useMemo } from "react";
import { Header } from "@/components/casino/Header";
import { Sidebar } from "@/components/casino/Sidebar";
import { HeroBanner } from "@/components/casino/HeroBanner";
import { CategoryFilter } from "@/components/casino/CategoryFilter";
import { SearchBar } from "@/components/casino/SearchBar";
import { GamesGrid } from "@/components/casino/GamesGrid";
import { WinnersSection } from "@/components/casino/WinnersSection";
import { AuthModal } from "@/components/casino/AuthModal";
import { GameModal } from "@/components/casino/GameModal";
import { mockGames, mockWinners } from "@/data/mockData";
import { Game, User } from "@/types/casino";
import { toast } from "sonner";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);

  const isLoggedIn = !!user;

  const filteredGames = useMemo(() => {
    let games = mockGames;

    // Filter by category
    if (activeCategory !== "all") {
      games = games.filter((game) => {
        if (activeCategory === "live") return game.isLive;
        if (activeCategory === "slots") return game.category === "slots";
        if (activeCategory === "aviator") return game.category === "aviator";
        if (activeCategory === "crash") return game.category === "crash";
        if (activeCategory === "mines") return game.category === "mines";
        if (activeCategory === "spaceman") return game.category === "spaceman";
        if (activeCategory === "roulette") return game.category === "roulette";
        if (activeCategory === "fortune-tiger") return game.name.toLowerCase().includes("fortune");
        return true;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      games = games.filter(
        (game) =>
          game.name.toLowerCase().includes(query) ||
          game.provider.toLowerCase().includes(query)
      );
    }

    return games;
  }, [activeCategory, searchQuery]);

  const handleLogin = (email: string, password: string) => {
    // Simulate login - in production, connect to Lovable Cloud
    setUser({
      id: "1",
      code: email,
      email,
      name: email.split("@")[0],
      balance: 100,
    });
    setBalance(100);
    setIsAuthModalOpen(false);
    toast.success("Login realizado com sucesso!");
  };

  const handleRegister = (name: string, email: string, password: string) => {
    // Simulate register - in production, connect to Lovable Cloud
    setUser({
      id: "1",
      code: email,
      email,
      name,
      balance: 0,
    });
    setBalance(0);
    setIsAuthModalOpen(false);
    toast.success("Conta criada com sucesso! Faça seu primeiro depósito.");
  };

  const handlePlayGame = (game: Game) => {
    if (!isLoggedIn) {
      toast.error("Faça login para jogar");
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedGame(game);
    setIsGameModalOpen(true);
    
    // In production, call the Playfivers API to get game URL
    // For now, show the modal without a real game URL
    setGameUrl(null);
    toast.info(`Carregando ${game.name}...`);
  };

  const handleDeposit = () => {
    toast.info("Conecte o Lovable Cloud para habilitar depósitos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        balance={balance}
        isLoggedIn={isLoggedIn}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogin={() => setIsAuthModalOpen(true)}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 lg:pl-64">
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
          {/* Hero Banner */}
          <HeroBanner />

          {/* Search */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* Category Filter */}
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Winners Section */}
          <WinnersSection winners={mockWinners} />

          {/* Games Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {activeCategory === "all" ? "Todos os Jogos" : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace("-", " ")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredGames.length} jogos
              </span>
            </div>
            <GamesGrid games={filteredGames} onPlayGame={handlePlayGame} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

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
