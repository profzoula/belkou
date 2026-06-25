-- BelKou — course_slug on registrations (per-course purchases)
alter table public.registrations add column if not exists course_slug text;
create index if not exists idx_registrations_course_slug on public.registrations (course_slug);
