alter table public.notifications
  add column if not exists timestamp timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create index if not exists notifications_user_timestamp_idx
  on public.notifications(user_id, timestamp desc);
