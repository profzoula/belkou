-- BelKou service image uploads (public read, server upload via service role)
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read service images" ON storage.objects;
CREATE POLICY "Public read service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');
