-- Google sync: tag rows by origin so synced data can be replaced without
-- touching manually/bot-created rows, and track last-sync times for rate limiting.

-- events: 'manual' (seed/bot) vs 'gcal' (Google Calendar iCal)
alter table public.events add column if not exists source text not null default 'manual';
alter table public.events add column if not exists ext_id text;
create index if not exists events_source_idx on public.events (source);

-- inbox: 'manual' (seed) vs 'gmail'
alter table public.inbox add column if not exists source text not null default 'manual';
alter table public.inbox add column if not exists ext_id text;
create index if not exists inbox_source_idx on public.inbox (source);

-- last-sync timestamps (server-only; service role bypasses RLS, no client policy)
create table if not exists public.sync_state (
  id text primary key default 'default',
  calendar_at timestamptz,
  gmail_at timestamptz
);
insert into public.sync_state (id) values ('default') on conflict (id) do nothing;
alter table public.sync_state enable row level security;
