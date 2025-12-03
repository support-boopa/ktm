import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { GameCard } from "@/components/games/GameCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useGame, useGames } from "@/hooks/useGames";
import {
  Download,
  Star,
  Eye,
  User,
  ChevronRight,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";

const GameDetails = () => {
  const { slug } = useParams();
  const { game, relatedGames, isLoading } = useGame(slug || "");
  const { incrementViews } = useGames();

  useEffect(() => {
    if (game) {
      incrementViews(game.id);
    }
  }, [game?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="font-display text-2xl font-bold mb-4">اللعبة غير موجودة</h1>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <span className="relative z-10">العودة للرئيسية</span>
            <ArrowRight className="w-4 h-4 relative z-10" />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px]">
        <img
          src={game.background_image || game.image}
          alt={game.title}
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      <div className="container mx-auto px-4 -mt-48 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{game.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                {game.title} Free Download
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {game.developer && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{game.developer}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{game.views.toLocaleString()} مشاهدة</span>
                </div>
                {game.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{game.rating}</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{game.description}</p>

              {game.features && game.features.length > 0 && (
                <ul className="space-y-2">
                  {game.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-1" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* System Requirements */}
            {game.system_requirements_minimum && (
              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold mb-4">متطلبات النظام</h2>
                <div className="space-y-2 text-sm">
                  <p><strong>OS:</strong> {game.system_requirements_minimum.os}</p>
                  <p><strong>Processor:</strong> {game.system_requirements_minimum.processor}</p>
                  <p><strong>Memory:</strong> {game.system_requirements_minimum.memory}</p>
                  <p><strong>Graphics:</strong> {game.system_requirements_minimum.graphics}</p>
                  <p><strong>Storage:</strong> {game.system_requirements_minimum.storage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="font-display font-bold mb-4">معلومات اللعبة</h3>
              <div className="space-y-3 text-sm mb-6">
                {game.genre && <p><span className="text-muted-foreground">النوع:</span> {game.genre}</p>}
                {game.developer && <p><span className="text-muted-foreground">المطور:</span> {game.developer}</p>}
                <p><span className="text-muted-foreground">الحجم:</span> {game.size}</p>
                <p><span className="text-muted-foreground">الإصدار:</span> {game.version}</p>
                <p className="text-primary font-medium">Pre-Installed Game</p>
              </div>

              {game.download_link && (
                <a
                  href={game.download_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-bold">تحميل اللعبة</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="py-16">
            <SectionHeader title="ألعاب مشابهة" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedGames.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default GameDetails;