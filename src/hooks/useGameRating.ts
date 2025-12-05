import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAchievements } from './useAchievements';

interface RatingInfo {
  userRating: number | null;
  averageRating: number;
  totalRatings: number;
}

export const useGameRating = (gameId: string) => {
  const [ratingInfo, setRatingInfo] = useState<RatingInfo>({
    userRating: null,
    averageRating: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { unlockAchievement, hasAchievement } = useAchievements();

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

  const fetchRating = useCallback(async () => {
    if (!gameId) return;

    // Fetch user's rating if logged in
    if (userId) {
      const { data: userRating } = await supabase
        .from('game_ratings')
        .select('rating')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .single();

      if (userRating) {
        setRatingInfo(prev => ({ ...prev, userRating: userRating.rating }));
      } else {
        setRatingInfo(prev => ({ ...prev, userRating: null }));
      }
    }

    // Fetch all ratings for average
    const { data: ratings } = await supabase
      .from('game_ratings')
      .select('rating')
      .eq('game_id', gameId);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setRatingInfo(prev => ({
        ...prev,
        averageRating: Math.round(avg * 10) / 10,
        totalRatings: ratings.length
      }));
    } else {
      setRatingInfo(prev => ({
        ...prev,
        averageRating: 0,
        totalRatings: 0
      }));
    }

    setIsLoading(false);
  }, [gameId, userId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  const submitRating = async (rating: number) => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول لتقييم اللعبة');
      return false;
    }
    
    if (!gameId) return false;

    const { error } = await supabase
      .from('game_ratings')
      .upsert({
        user_id: userId,
        game_id: gameId,
        rating
      }, {
        onConflict: 'user_id,game_id'
      });

    if (error) {
      console.error('Rating error:', error);
      toast.error('حدث خطأ في حفظ التقييم');
      return false;
    }

    toast.success('شكراً على تقييمك! ⭐');
    
    // Unlock rating achievements
    if (!hasAchievement('rater')) {
      unlockAchievement('rater');
    }
    
    // Auto-verify challenges
    try {
      await supabase.functions.invoke('verify-challenge', {
        body: { 
          userId, 
          challengeId: 'auto',
          action: 'rate_games'
        }
      });
    } catch (e) {
      console.log('Challenge verification skipped');
    }
    
    fetchRating();
    return true;
  };

  return {
    ...ratingInfo,
    isLoading,
    submitRating,
    refetch: fetchRating
  };
};
