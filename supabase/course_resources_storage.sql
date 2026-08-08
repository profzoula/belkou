-- BelKou course resource uploads (PDF, Word, ebooks, etc.)
-- Run in Supabase Dashboard → SQL Editor
--
-- IMPORTANT: bucket is PRIVATE. Downloads are served via short-lived signed URLs
-- after server-side enrollment checks (see getCourseResourceDownloadUrl).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-resources',
  'course-resources',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read course resources" ON storage.objects;
DROP POLICY IF EXISTS "Service role manage course resources" ON storage.objects;

-- No public/authenticated SELECT policies. The app server uses the service role
-- to upload files and mint short-lived signed download URLs after enrollment checks.
