import { Game } from "@/types/casino";
import { GameCard } from "./GameCard";

interface GamesGridProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
}

export const GamesGrid = ({ games, onPlayGame }: GamesGridProps) => {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-secondary mb-4">
          <span className="text-4xl">🎮</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum jogo encontrado</h3>
        <p className="text-sm text-muted-foreground">Tente buscar por outro termo ou categoria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {games.map((game) => (
        <GameCard 
          key={game.id} 
          game={game} 
          onPlay={onPlayGame}
        />
      ))}
    </div>
  );
};
