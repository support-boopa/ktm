-- Add additional_files column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS additional_files jsonb[] DEFAULT NULL;