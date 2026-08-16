-- BelKou — Live course sessions (OBS ingest via YouTube / Vimeo / HLS) + student comments

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  title text not null check (char_length(trim(title)) >= 3),
  description text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended', 'canceled')),
  provider text not null default 'youtube'
    check (provider in ('youtube', 'vimeo', 'hls')),
  playback_url text not null,
  scheduled_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  recording_lesson_id text,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_sessions_status_scheduled
  on public.live_sessions (status, scheduled_at desc);

create index if not exists idx_live_sessions_course
  on public.live_sessions (course_slug, scheduled_at desc);

create table if not exists public.live_comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  author_user_id text not null,
  author_email text not null,
  author_name text not null,
  body text not null check (char_length(trim(body)) >= 1 and char_length(body) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_live_comments_session_created
  on public.live_comments (session_id, created_at asc);

alter table public.live_sessions enable row level security;
alter table public.live_comments enable row level security;

drop policy if exists "deny_live_sessions" on public.live_sessions;
create policy "deny_live_sessions" on public.live_sessions
  for all to anon, authenticated using (false) with check (false);

drop policy if exists "deny_live_comments" on public.live_comments;
create policy "deny_live_comments" on public.live_comments
  for all to anon, authenticated using (false) with check (false);
