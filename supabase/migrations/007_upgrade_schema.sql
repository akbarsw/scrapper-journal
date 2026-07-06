-- Upgrade saved_papers to add notes and tags
alter table public.saved_papers add column if not exists notes text;
alter table public.saved_papers add column if not exists tags text[];

-- Optional fallback for legacy uppercase table
alter table public."SavedPapers" add column if not exists notes text;
alter table public."SavedPapers" add column if not exists tags text[];

-- Create collections table
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null
);

-- Create collection_papers many-to-many join table
create table if not exists public.collection_papers (
  collection_id uuid references public.collections(id) on delete cascade not null,
  paper_id uuid references public.saved_papers(id) on delete cascade not null,
  added_at timestamp with time zone default now() not null,
  primary key (collection_id, paper_id)
);

-- Enable Row Level Security (RLS)
alter table public.collections enable row level security;
alter table public.collection_papers enable row level security;

-- Drop policies if exist to prevent errors on multiple runs
drop policy if exists "Users can view own collections" on public.collections;
drop policy if exists "Users can insert own collections" on public.collections;
drop policy if exists "Users can update own collections" on public.collections;
drop policy if exists "Users can delete own collections" on public.collections;

drop policy if exists "Users can view papers in own collections" on public.collection_papers;
drop policy if exists "Users can add papers to own collections" on public.collection_papers;
drop policy if exists "Users can remove papers from own collections" on public.collection_papers;

-- Define Collections policies
create policy "Users can view own collections"
  on public.collections for select
  using (auth.uid() = user_id);

create policy "Users can insert own collections"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own collections"
  on public.collections for update
  using (auth.uid() = user_id);

create policy "Users can delete own collections"
  on public.collections for delete
  using (auth.uid() = user_id);

-- Define Collection Papers policies
create policy "Users can view papers in own collections"
  on public.collection_papers for select
  using (
    exists (
      select 1 from public.collections
      where id = collection_id and user_id = auth.uid()
    )
  );

create policy "Users can add papers to own collections"
  on public.collection_papers for insert
  with check (
    exists (
      select 1 from public.collections
      where id = collection_id and user_id = auth.uid()
    )
  );

create policy "Users can remove papers from own collections"
  on public.collection_papers for delete
  using (
    exists (
      select 1 from public.collections
      where id = collection_id and user_id = auth.uid()
    )
  );

-- Create optimized index keys for query acceleration
create index if not exists idx_saved_papers_user_id on public.saved_papers(user_id);
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collection_papers_paper_id on public.collection_papers(paper_id);
