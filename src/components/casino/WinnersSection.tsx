import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface Winner {
  id: string;
  user_name: string;
  game_name: string;
  game_image: string | null;
  amount: number;
}

interface WinnersSettings {
  is_enabled: boolean;
  auto_generate: boolean;
  display_count: number;
  min_amount: number;
  max_amount: number;
  refresh_interval: number;
}

// Random names for auto-generated winners
const randomNames = [
  "Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena",
  "Igor", "Julia", "Lucas", "Maria", "Nicolas", "Olivia", "Pedro", "Raquel",
  "Samuel", "Tatiana", "Vitor", "Amanda", "Beatriz", "Caio", "Diana", "Felipe",
];

const gameNames = [
  "Fortune Tiger", "Sweet Bonanza", "Gates of Olympus", "Aviator", "Mines",
  "Fortune Rabbit", "Fortune Ox", "Crazy Time", "Lightning Roulette", "Spaceman",
];

export const WinnersSection = () => {
  const [generatedWinners, setGeneratedWinners] = useState<Winner[]>([]);

  // Fetch winners settings
  const { data: settings } = useQuery({
    queryKey: ["winners-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners_settings")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      return data as WinnersSettings | null;
    },
  });

  // Fetch manual winners
  const { data: manualWinners } = useQuery({
    queryKey: ["winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Winner[];
    },
  });

  // Generate random winners if auto_generate is enabled
  useEffect(() => {
    if (!settings?.auto_generate) return;

    const generateWinners = () => {
      const count = settings?.display_count || 10;
      const minAmount = settings?.min_amount || 100;
      const maxAmount = settings?.max_amount || 5000;

      const winners: Winner[] = Array.from({ length: count }, (_, i) => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        const game = gameNames[Math.floor(Math.random() * gameNames.length)];
        const amount = Math.floor(Math.random() * (maxAmount - minAmount) + minAmount);

        return {
          id: `gen-${i}-${Date.now()}`,
          user_name: `${name} ****`,
          game_name: game,
          game_image: null,
          amount,
        };
      });

      setGeneratedWinners(winners);
    };

    generateWinners();

    const interval = setInterval(
      generateWinners,
      (settings?.refresh_interval || 30) * 1000
    );

    return () => clearInterval(interval);
  }, [settings]);

  // If disabled, don't render
  if (settings && !settings.is_enabled) return null;

  const displayWinners = settings?.auto_generate
    ? generatedWinners
    : manualWinners || [];

  if (displayWinners.length === 0) return null;

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
        {displayWinners.map((winner) => (
          <div
            key={winner.id}
            className="flex-shrink-0 w-[100px] space-y-2 animate-fade-in"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-casino-gold/30 bg-card">
              {winner.game_image ? (
                <img
                  src={winner.game_image}
                  alt={winner.game_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-casino-purple/20">
                  <span className="text-3xl">🎰</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-1 left-1 right-1">
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-casino-gold text-background rounded">
                  SORTEIO
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground truncate">
                {winner.user_name}
              </p>
              <p className="text-sm font-bold text-accent">
                R$ {winner.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};