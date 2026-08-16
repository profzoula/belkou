-- Live event thumbnail (16:9 poster on /live, player placeholder, cards)

alter table public.live_sessions
  add column if not exists thumbnail_url text;
