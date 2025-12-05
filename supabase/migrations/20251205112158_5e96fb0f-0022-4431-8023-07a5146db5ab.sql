
-- Create user_favorites table for saving favorite games
CREATE TABLE public.user_favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    collection_name TEXT DEFAULT 'المفضلة',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, game_id)
);

-- Create user_achievements table for gamification
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_icon TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_type)
);

-- Create user_stats table for tracking user activity
CREATE TABLE public.user_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    games_viewed INTEGER DEFAULT 0,
    games_downloaded INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    chat_messages_sent INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    first_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    streak_days INTEGER DEFAULT 1,
    longest_streak INTEGER DEFAULT 1
);

-- Create game_ratings table for user ratings
CREATE TABLE public.game_ratings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, game_id)
);

-- Create site_announcements table for important announcements
CREATE TABLE public.site_announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for anonymous access (using device ID)
CREATE POLICY "Allow all operations on favorites" ON public.user_favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on achievements" ON public.user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stats" ON public.user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ratings" ON public.game_ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read on announcements" ON public.site_announcements FOR SELECT USING (true);

-- Function to calculate average rating for a game
CREATE OR REPLACE FUNCTION public.get_game_average_rating(game_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0) INTO avg_rating
    FROM public.game_ratings
    WHERE game_id = game_uuid;
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to get rating count for a game
CREATE OR REPLACE FUNCTION public.get_game_rating_count(game_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    rating_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rating_count
    FROM public.game_ratings
    WHERE game_id = game_uuid;
    RETURN rating_count;
END;
$$ LANGUAGE plpgsql;
