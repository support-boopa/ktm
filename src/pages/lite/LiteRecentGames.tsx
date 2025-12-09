import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const LiteRecentGames = () => {
  const { games, isLoading } = useGames();

  const recentGames = [...games]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
          title="أحدث الألعاب"
          subtitle="آخر الألعاب المضافة للمكتبة"
        />
        <div className="lite-game-grid">
          {recentGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {recentGames.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">🆕</div>
            <p className="lite-empty-text">لا توجد ألعاب</p>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteRecentGames;
