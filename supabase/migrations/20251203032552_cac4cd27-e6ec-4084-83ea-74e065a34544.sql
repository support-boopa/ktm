-- Create games table
CREATE TABLE public.games (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT NOT NULL,
    background_image TEXT,
    version TEXT NOT NULL DEFAULT '1.0',
    category TEXT NOT NULL,
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    size TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[],
    system_requirements_minimum JSONB,
    system_requirements_recommended JSONB,
    download_link TEXT,
    screenshots TEXT[],
    developer TEXT,
    genre TEXT,
    rating DECIMAL(2,1) DEFAULT 4.5,
    views INTEGER NOT NULL DEFAULT 0,
    platforms TEXT[] DEFAULT ARRAY['Windows'],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Games are publicly readable" 
ON public.games 
FOR SELECT 
USING (true);

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'Gamepad2',
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Categories are publicly readable" 
ON public.categories 
FOR SELECT 
USING (true);

-- Insert default categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Action', 'action', 'Sword'),
('Adventure', 'adventure', 'Compass'),
('RPG', 'rpg', 'Shield'),
('Sports', 'sports', 'Trophy'),
('Racing', 'racing', 'Car'),
('Simulation', 'simulation', 'Monitor'),
('Strategy', 'strategy', 'Brain'),
('Horror', 'horror', 'Ghost');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update category count
CREATE OR REPLACE FUNCTION public.update_category_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.categories SET count = count + 1 WHERE slug = NEW.category;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.categories SET count = count - 1 WHERE slug = OLD.category;
    ELSIF TG_OP = 'UPDATE' AND OLD.category != NEW.category THEN
        UPDATE public.categories SET count = count - 1 WHERE slug = OLD.category;
        UPDATE public.categories SET count = count + 1 WHERE slug = NEW.category;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update category counts
CREATE TRIGGER update_category_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_category_count();