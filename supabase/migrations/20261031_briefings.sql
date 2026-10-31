-- Weekly trend briefings ("주간 브리핑"): one short write-up per finished week and language.
-- Run once in the Supabase SQL editor. Only the server (service-role key) reads and writes this table, so row
-- level security is switched on with no policies: the public key can't see it at all.

create table if not exists public.briefings (
  week_start    date not null,           -- the Monday (UTC) the week begins
  lang          text not null check (lang in ('ko', 'en')),
  body          text not null,           -- paragraphs separated by a blank line
  article_count integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (week_start, lang)
);

alter table public.briefings enable row level security;
