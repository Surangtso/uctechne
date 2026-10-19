-- Hand-curated posts live in the same table as collected articles.
-- Run once in the Supabase SQL editor BEFORE deploying the curation feature.

alter table public.articles
  add column if not exists curated      boolean not null default false,
  -- who wrote the post and where it appeared (e.g. 知乎, X, a blog); shown next to the title
  add column if not exists author       text,
  add column if not exists source_label text,
  -- an optional short quotation, one or two sentences at most
  add column if not exists quote        text;

create index if not exists articles_curated_sort_idx on public.articles (sort_at desc) where curated;
