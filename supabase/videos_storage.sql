-- BelKou — private bucket for source MP4 uploads (HLS output added by worker later)
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos',
  'course-videos',
  false,
  2147483648,
  ARRAY['video/mp4', 'video/quicktime', 'video/mp2t', 'application/vnd.apple.mpegurl', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Service role uploads via API; students never read raw MP4 from this bucket.
DROP POLICY IF EXISTS "No public read course videos" ON storage.objects;
CREATE POLICY "No public read course videos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (false);
