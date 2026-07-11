-- BelKou — self-hosted course videos (source MP4 + HLS metadata)

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  original_size bigint,
  duration_seconds int,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'failed')),
  storage_path text,
  hls_path text,
  poster_path text,
  preview_path text,
  error_message text,
  course_slug text,
  lesson_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_status on public.videos (status);
create index if not exists idx_videos_course_lesson on public.videos (course_slug, lesson_id);

alter table public.videos enable row level security;

drop policy if exists "No public access to videos" on public.videos;

create policy "No public access to videos"
  on public.videos
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- Resume playback (keep completed_at for backward compatibility)
alter table public.lesson_progress
  add column if not exists current_time_seconds int not null default 0;

alter table public.lesson_progress
  add column if not exists last_watched_at timestamptz;

-- Allow saving playback position before lesson completion
alter table public.lesson_progress
  alter column completed_at drop not null;
