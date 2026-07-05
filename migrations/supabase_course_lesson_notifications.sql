-- BelKou — Notifications when a new course video lesson is published

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('forum_post', 'forum_reply', 'course_lesson'));

alter table public.notifications
  add column if not exists lesson_id text;
