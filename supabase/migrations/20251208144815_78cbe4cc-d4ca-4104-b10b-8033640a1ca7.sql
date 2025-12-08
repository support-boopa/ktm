-- Create storage bucket for trailers
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-trailers', 'game-trailers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to trailers
CREATE POLICY "Trailers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-trailers');

-- Allow authenticated uploads (admin only in practice)
CREATE POLICY "Allow trailer uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-trailers');

-- Allow updates
CREATE POLICY "Allow trailer updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'game-trailers');

-- Allow deletes
CREATE POLICY "Allow trailer deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-trailers');