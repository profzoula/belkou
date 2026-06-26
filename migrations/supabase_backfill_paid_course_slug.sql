-- BelKou — backfill course_slug for legacy cohort payers (Premium/VIP)
-- Run if paid students see "S'inscrire" despite admin showing Accès actif

UPDATE public.registrations
SET course_slug = 'apps-ia-cursor-claude'
WHERE payment_status = 'paid'
  AND (course_slug IS NULL OR trim(course_slug) = '');
