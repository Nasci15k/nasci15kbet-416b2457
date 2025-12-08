import { Game } from "@/types/casino";
import { cn } from "@/lib/utils";
import { Play, Star } from "lucide-react";
import { useState } from "react";

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onFavorite?: (game: Game) => void;
}

export const GameCard = ({ game, onPlay, onFavorite }: GameCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onFavorite?.(game);
  };

  return (
    <div 
      className="casino-card group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(game)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"
        />
        
        {!imageError ? (
          <img 
            src={game.image} 
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-casino-purple/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{game.name.charAt(0)}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {game.isLive && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded">
              AO VIVO
            </span>
          )}
          {game.isFeatured && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-casino-gold text-background rounded">
              DESTAQUE
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button 
          onClick={handleFavorite}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-background/50 backdrop-blur hover:bg-background/80 transition-colors"
        >
          <Star className={cn(
            "h-4 w-4 transition-colors",
            isFavorite ? "fill-casino-gold text-casino-gold" : "text-muted-foreground"
          )} />
        </button>

        {/* Play overlay */}
        <div className={cn(
          "absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <div className="p-4 rounded-full bg-primary glow-primary animate-pulse-glow">
            <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm text-foreground truncate">{game.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{game.provider}</p>
      </div>
    </div>
  );
};
