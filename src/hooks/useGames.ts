import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Game {
  id: string;
  title: string;
  slug: string;
  image: string;
  background_image: string | null;
  version: string;
  category: string;
  release_date: string;
  size: string;
  description: string;
  features: string[] | null;
  system_requirements_minimum: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  } | null;
  system_requirements_recommended: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  } | null;
  download_link: string | null;
  screenshots: string[] | null;
  developer: string | null;
  genre: string | null;
  rating: number | null;
  views: number;
  platforms: string[] | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGames();
    fetchCategories();
  }, []);

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setGames(data as unknown as Game[]);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const incrementViews = async (gameId: string) => {
    // Check if already viewed in this session
    const viewedGames = JSON.parse(localStorage.getItem("ktm_viewed_games") || "[]");
    if (viewedGames.includes(gameId)) {
      return;
    }

    // Mark as viewed
    viewedGames.push(gameId);
    localStorage.setItem("ktm_viewed_games", JSON.stringify(viewedGames));

    // Increment in database using direct update
    await supabase
      .from("games")
      .update({ views: supabase.rpc ? undefined : undefined })
      .eq("id", gameId);
    
    // Use raw SQL increment via edge function or direct increment
    const { data: game } = await supabase
      .from("games")
      .select("views")
      .eq("id", gameId)
      .single();
    
    if (game) {
      await supabase
        .from("games")
        .update({ views: (game.views || 0) + 1 })
        .eq("id", gameId);
    }
  };

  return { games, categories, isLoading, incrementViews, refetch: fetchGames };
}

export function useGame(slug: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchGame();
    }
  }, [slug]);

  const fetchGame = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    
    if (!error && data) {
      setGame(data as unknown as Game);
      
      // Fetch related games
      const { data: related } = await supabase
        .from("games")
        .select("*")
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(6);
      
      if (related) {
        setRelatedGames(related as unknown as Game[]);
      }
    }
    setIsLoading(false);
  };

  return { game, relatedGames, isLoading };
}