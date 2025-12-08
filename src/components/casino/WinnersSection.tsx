import { Winner } from "@/types/casino";
import { Trophy } from "lucide-react";

interface WinnersSectionProps {
  winners: Winner[];
}

export const WinnersSection = ({ winners }: WinnersSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-casino-gold/20">
          <Trophy className="h-5 w-5 text-casino-gold" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">MAIORES GANHOS</h3>
          <p className="text-xs text-muted-foreground">HOJE</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {winners.map((winner) => (
          <div 
            key={winner.id}
            className="flex-shrink-0 w-[100px] space-y-2 animate-fade-in"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-casino-gold/30">
              <img 
                src={winner.gameImage} 
                alt={winner.gameName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-1 left-1 right-1">
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-casino-gold text-background rounded">
                  SORTEIO
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground truncate">{winner.userName}</p>
              <p className="text-sm font-bold text-accent">R$ {winner.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
