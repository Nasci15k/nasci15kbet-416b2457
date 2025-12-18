import { useMemo } from "react";
import { Game } from "@/types/casino";
import { GameCarousel } from "./GameCarousel";
import { GameProvider } from "@/hooks/useGames";
import { Star, Sparkles } from "lucide-react";

interface ProviderCarouselsProps {
  games: Game[];
  providers: GameProvider[];
  onPlayGame: (game: Game) => void;
  onViewProvider?: (providerId: string) => void;
}

export const ProviderCarousels = ({
  games,
  providers,
  onPlayGame,
  onViewProvider,
}: ProviderCarouselsProps) => {
  // Group games by provider
  const { featuredGames, gamesByProvider } = useMemo(() => {
    const featured = games.filter((g) => g.isFeatured);
    const byProvider = new Map<string, Game[]>();

    games.forEach((game) => {
      if (game.providerId) {
        const key = String(game.providerId);
        const existing = byProvider.get(key) || [];
        if (existing.length < 20) {
          existing.push(game);
          byProvider.set(key, existing);
        }
      }
    });

    return { featuredGames: featured, gamesByProvider: byProvider };
  }, [games]);

  // Get providers that have games, sorted by game count
  const providersWithGames = useMemo(() => {
    return providers
      .filter((p) => gamesByProvider.has(p.id))
      .sort((a, b) => {
        const countA = gamesByProvider.get(a.id)?.length || 0;
        const countB = gamesByProvider.get(b.id)?.length || 0;
        return countB - countA;
      });
  }, [providers, gamesByProvider]);

  return (
    <div className="space-y-6">
      {/* Featured Games Carousel */}
      {featuredGames.length > 0 && (
        <GameCarousel
          title="Jogos em Destaque"
          games={featuredGames}
          onPlayGame={onPlayGame}
          icon={<Star className="h-5 w-5 text-casino-gold fill-casino-gold" />}
        />
      )}

      {/* Provider Carousels */}
      {providersWithGames.map((provider) => {
        const providerGames = gamesByProvider.get(provider.id) || [];
        if (providerGames.length === 0) return null;

        return (
          <GameCarousel
            key={provider.id}
            title={provider.name}
            games={providerGames}
            onPlayGame={onPlayGame}
            icon={
              provider.logo ? (
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="h-6 w-6 rounded object-contain"
                />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )
            }
            showViewAll={providerGames.length >= 15}
            onViewAll={() => onViewProvider?.(provider.id)}
          />
        );
      })}
    </div>
  );
};