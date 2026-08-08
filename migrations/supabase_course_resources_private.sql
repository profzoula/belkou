-- Make the course-resources bucket private (run if the bucket was previously public).
-- Safe to re-run: sets public = false and removes the old public read policy.

UPDATE storage.buckets
SET public = false
WHERE id = 'course-resources';

DROP POLICY IF EXISTS "Public read course resources" ON storage.objects;
