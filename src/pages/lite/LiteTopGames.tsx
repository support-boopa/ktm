import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const LiteTopGames = () => {
  const { games, isLoading } = useGames();

  const topGames = [...games]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 30);

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
          title="الأكثر مشاهدة"
          subtitle="الألعاب الأكثر تحميلاً وزيارة"
        />
        <div className="lite-game-grid">
          {topGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {topGames.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">📊</div>
            <p className="lite-empty-text">لا توجد ألعاب</p>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteTopGames;
