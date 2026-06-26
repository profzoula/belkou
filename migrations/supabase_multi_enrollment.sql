-- BelKou — allow multiple course enrollments per email
-- Run after supabase_registrations.sql and supabase_course_slug.sql

alter table public.registrations add column if not exists course_slug text;

-- Legacy rows without course_slug → default course
update public.registrations
set course_slug = 'apps-ia-cursor-claude'
where course_slug is null or trim(course_slug) = '';

alter table public.registrations drop constraint if exists registrations_email_unique;

create unique index if not exists idx_registrations_email_course_unique
  on public.registrations (
    lower(email),
    coalesce(nullif(trim(course_slug), ''), 'apps-ia-cursor-claude')
  );

create index if not exists idx_registrations_email on public.registrations (lower(email));
