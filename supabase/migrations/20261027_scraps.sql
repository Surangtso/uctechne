-- Saved articles per signed-in user ("내 스크랩" synced across devices).
-- Run once in the Supabase SQL editor BEFORE deploying the account sync.
-- The browser talks to this table directly with the public key plus the user's login, so row level security
-- is what keeps people out of each other's lists: each user can only see, add and delete their own rows.

create table if not exists public.scraps (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.scraps enable row level security;

create policy "own scraps: read"   on public.scraps for select to authenticated using (auth.uid() = user_id);
create policy "own scraps: add"    on public.scraps for insert to authenticated with check (auth.uid() = user_id);
create policy "own scraps: delete" on public.scraps for delete to authenticated using (auth.uid() = user_id);
