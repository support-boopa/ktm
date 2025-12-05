import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { GameCard } from '@/components/games/GameCard';
import { Heart, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  version: string;
  category: string;
  size: string;
  rating: number | null;
  views: number;
  created_at: string;
}

const Favorites = () => {
  const { favorites, isLoading: favoritesLoading, removeFavorite } = useFavorites();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      if (favorites.length === 0) {
        setGames([]);
        setIsLoading(false);
        return;
      }

      const gameIds = favorites.map(f => f.game_id);
      const { data } = await supabase
        .from('games')
        .select('id, title, slug, image, version, category, size, rating, views, created_at')
        .in('id', gameIds);

      if (data) {
        // Sort by favorite order
        const sortedGames = gameIds
          .map(id => data.find(g => g.id === id))
          .filter((g): g is Game => g !== undefined);
        setGames(sortedGames);
      }
      setIsLoading(false);
    };

    if (!favoritesLoading) {
      fetchGames();
    }
  }, [favorites, favoritesLoading]);

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveAll = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع الألعاب من المفضلة؟')) return;
    
    for (const game of games) {
      await removeFavorite(game.id);
    }
  };

  if (isLoading || favoritesLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-rose-500/20 blur-3xl -z-10" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                  <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                  ألعابي المفضلة
                </h1>
                <p className="text-muted-foreground">
                  {games.length} لعبة في قائمة المفضلة
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث في المفضلة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                {games.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleRemoveAll}
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الكل
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Games Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredGames.map((game, index) => (
                <div key={game.id} className="relative group">
                  <GameCard game={game} index={index} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFavorite(game.id);
                    }}
                    className="absolute top-2 left-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-2xl font-bold mb-2">
                {searchQuery ? 'لا توجد نتائج' : 'قائمة المفضلة فارغة'}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'جرب البحث بكلمات مختلفة' 
                  : 'أضف ألعابك المفضلة بالضغط على أيقونة القلب'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Favorites;
