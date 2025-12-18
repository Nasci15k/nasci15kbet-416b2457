import { useRef } from "react";
import { Game } from "@/types/casino";
import { GameCard } from "./GameCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GameCarouselProps {
  title: string;
  games: Game[];
  onPlayGame: (game: Game) => void;
  icon?: React.ReactNode;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const GameCarousel = ({
  title,
  games,
  onPlayGame,
  icon,
  showViewAll,
  onViewAll,
}: GameCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (games.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-foreground text-lg">{title}</h3>
          <span className="text-sm text-muted-foreground">({games.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {showViewAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={onViewAll}
            >
              Ver todos
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {games.map((game) => (
          <div
            key={game.id}
            className="flex-shrink-0 w-[140px] sm:w-[160px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <GameCard game={game} onPlay={onPlayGame} />
          </div>
        ))}
      </div>
    </div>
  );
};