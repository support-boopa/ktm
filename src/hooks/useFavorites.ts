import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  game_id: string;
  collection_name: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFavorites(data);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (gameId: string, collectionName: string = 'المفضلة') => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول لإضافة المفضلة');
      return false;
    }

    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, game_id: gameId, collection_name: collectionName });

    if (error) {
      if (error.code === '23505') {
        toast.error('اللعبة موجودة بالفعل في المفضلة');
      } else {
        toast.error('حدث خطأ في الإضافة للمفضلة');
      }
      return false;
    }

    toast.success('تمت الإضافة للمفضلة ⭐');
    fetchFavorites();
    return true;
  };

  const removeFavorite = async (gameId: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);

    if (error) return false;

    toast.success('تمت الإزالة من المفضلة');
    fetchFavorites();
    return true;
  };

  const isFavorite = (gameId: string) => {
    return favorites.some(f => f.game_id === gameId);
  };

  const toggleFavorite = async (gameId: string) => {
    if (isFavorite(gameId)) {
      return removeFavorite(gameId);
    }
    return addFavorite(gameId);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
};
