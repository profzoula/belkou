-- BelKou testimonial avatar uploads (public read, server upload via service role)
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonial-avatars',
  'testimonial-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read testimonial avatars" ON storage.objects;
CREATE POLICY "Public read testimonial avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonial-avatars');
