-- Bot memory for the Telegram assistant.
--   bot_messages: short-term memory (recent conversation, per Telegram chat).
--   bot_facts:    long-term memory (things the user asked the bot to remember).
-- RLS stays enabled with NO policies (same as 0005): only the server's
-- service-role key can read/write these tables.

create table if not exists public.bot_messages (
  id bigint generated always as identity primary key,
  chat_id bigint not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists bot_messages_chat_idx
  on public.bot_messages (chat_id, created_at desc);

create table if not exists public.bot_facts (
  id uuid primary key default gen_random_uuid(),
  fact text not null,
  created_at timestamptz not null default now()
);

alter table public.bot_messages enable row level security;
alter table public.bot_facts    enable row level security;
