-- Create function to increment views
CREATE OR REPLACE FUNCTION public.increment_views(game_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.games SET views = views + 1 WHERE id = game_id;
END;
$$;