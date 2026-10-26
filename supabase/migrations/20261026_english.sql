-- English edition (/en): English title, summary and comment next to the Korean ones.
-- Run once in the Supabase SQL editor BEFORE deploying the English edition.

alter table public.articles
  add column if not exists title_en          text,
  add column if not exists summary_en        text,
  add column if not exists comment_en        text,
  -- when the English text was written; null = still to do
  add column if not exists en_at             timestamptz,
  -- English versions of the hand-written curation fields
  add column if not exists comment_manual_en text,
  add column if not exists quote_en          text,
  add column if not exists author_en         text;

create index if not exists articles_pending_en_idx on public.articles (sort_at desc)
  where is_tech and en_at is null;
