import { useParams } from "react-router-dom";
import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const LiteCategoryGames = () => {
  const { slug } = useParams();
  const { games, categories, isLoading } = useGames();

  const category = categories.find((c) => c.slug === slug);
  
  const categoryGames = games.filter((game) => {
    const gameGenres = (game.genre || game.category || "").toLowerCase();
    return gameGenres.includes(slug?.toLowerCase() || "");
  });

  if (isLoading) {
    return (
      <LiteLayout>
        <div className="lite-loading">جاري التحميل...</div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout>
      <section className="lite-container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <LiteSectionHeader
          title={category?.name || slug || "التصنيف"}
          subtitle={`${categoryGames.length} لعبة في هذا التصنيف`}
        />
        <div className="lite-game-grid">
          {categoryGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {categoryGames.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">🎮</div>
            <p className="lite-empty-text">لا توجد ألعاب في هذا التصنيف</p>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteCategoryGames;
