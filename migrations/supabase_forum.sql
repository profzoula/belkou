-- BelKou — Forum étudiant par cours + notifications in-app

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  kind text not null default 'question' check (kind in ('question', 'suggestion')),
  author_user_id text not null,
  author_email text not null,
  author_name text not null,
  title text not null check (char_length(trim(title)) >= 3),
  body text not null check (char_length(trim(body)) >= 1),
  reply_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_forum_posts_course_activity
  on public.forum_posts (course_slug, last_activity_at desc);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  course_slug text not null,
  author_user_id text not null,
  author_email text not null,
  author_name text not null,
  body text not null check (char_length(trim(body)) >= 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_replies_post
  on public.forum_replies (post_id, created_at asc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('forum_post', 'forum_reply')),
  title text not null,
  body text,
  course_slug text,
  post_id uuid references public.forum_posts(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "deny_forum_posts" on public.forum_posts;
create policy "deny_forum_posts" on public.forum_posts
  for all to anon, authenticated using (false) with check (false);

drop policy if exists "deny_forum_replies" on public.forum_replies;
create policy "deny_forum_replies" on public.forum_replies
  for all to anon, authenticated using (false) with check (false);

drop policy if exists "deny_notifications" on public.notifications;
create policy "deny_notifications" on public.notifications
  for all to anon, authenticated using (false) with check (false);
