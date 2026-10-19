-- Run once in the Supabase SQL editor of the project used for this site.

create table if not exists public.articles (
  id              text primary key,
  source_id       text not null,
  url             text not null unique,
  title_original  text not null,
  published_at    timestamptz,
  first_seen_at   timestamptz not null default now(),
  -- what the feed is sorted by: published_at when known, else first_seen_at
  sort_at         timestamptz not null,
  -- short plain-text snippet of the original; AI input only, never shown
  excerpt         text not null default '',
  paywalled       boolean not null default false,

  processed_at    timestamptz,
  summarized_at   timestamptz,
  is_tech         boolean,
  importance      smallint,
  title_ko        text,
  summary_ko      text,
  comment_ko      text,
  -- written by hand; wins over comment_ko when present
  comment_manual  text,

  -- hand-curated posts (see migrations/20261019_curated.sql)
  curated         boolean not null default false,
  author          text,
  source_label    text,
  quote           text
);

create index if not exists articles_sort_at_idx on public.articles (sort_at desc);
create index if not exists articles_source_sort_idx on public.articles (source_id, sort_at desc);
create index if not exists articles_pending_translate_idx on public.articles (sort_at desc) where processed_at is null;
create index if not exists articles_pending_summary_idx on public.articles (sort_at desc)
  where is_tech and summarized_at is null;

-- RLS on with no policies: the public (anon) key can read and write nothing.
-- The site and the update job use the server-only service-role key, which bypasses RLS.
alter table public.articles enable row level security;
