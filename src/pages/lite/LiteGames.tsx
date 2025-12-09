import { useState } from "react";
import { LiteLayout } from "@/components/lite/LiteLayout";
import { LiteGameCard } from "@/components/lite/LiteGameCard";
import { LiteSectionHeader } from "@/components/lite/LiteSectionHeader";
import { useGames } from "@/hooks/useGames";

const GAMES_PER_PAGE = 24;

const LiteGames = () => {
  const { games, isLoading } = useGames();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredGames = games.filter((game) =>
    game.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice(
    (page - 1) * GAMES_PER_PAGE,
    page * GAMES_PER_PAGE
  );

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <LiteSectionHeader title="جميع الألعاب" subtitle={`${games.length} لعبة متاحة`} />
          <input
            type="text"
            placeholder="ابحث عن لعبة..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="lite-search"
          />
        </div>

        <div className="lite-game-grid">
          {paginatedGames.map((game) => (
            <LiteGameCard key={game.id} game={game} />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="lite-empty">
            <div className="lite-empty-icon">🔍</div>
            <p className="lite-empty-text">لا توجد نتائج</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="lite-pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </button>
            <span style={{ padding: "0.5rem 1rem", color: "hsl(215 20% 65%)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              التالي
            </button>
          </div>
        )}
      </section>
    </LiteLayout>
  );
};

export default LiteGames;
