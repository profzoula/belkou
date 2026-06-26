-- BelKou — lesson completion progress per student email + course

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course_slug text not null,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  unique (email, course_slug, lesson_id)
);

create index if not exists idx_lesson_progress_email_course
  on public.lesson_progress (email, course_slug);

alter table public.lesson_progress enable row level security;

drop policy if exists "No public access to lesson_progress" on public.lesson_progress;

create policy "No public access to lesson_progress"
  on public.lesson_progress
  for all
  to anon, authenticated
  using (false)
  with check (false);
