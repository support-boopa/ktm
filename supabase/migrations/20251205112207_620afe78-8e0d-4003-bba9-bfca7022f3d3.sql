
-- Fix function search path for security
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
