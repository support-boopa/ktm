import { GameCard } from "./GameCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { Sparkles, Loader2 } from "lucide-react";

export const RecommendedGames = () => {
  const { recommendations, isLoading, hasViewedGames } = usePersonalizedRecommendations();

  // Don't show section if user hasn't viewed any games
  if (!hasViewedGames) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  // Don't show if no recommendations
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Special Header for Recommendations */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              مُقترح لك
            </h2>
            <p className="text-sm text-muted-foreground">
              بناءً على الألعاب التي شاهدتها
            </p>
          </div>
        </div>
        
        {/* Decorative gradient line */}
        <div className="mt-4 h-1 w-32 rounded-full bg-gradient-to-r from-primary via-secondary to-primary/50" />
      </div>

      {/* Recommendations Grid */}
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl blur-xl -z-10" />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {recommendations.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
