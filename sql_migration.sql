-- ========================================================
-- NEMU JURNAL - CONSOLIDATED DATABASE SCHEMA BASELINE
-- ========================================================

-- 1. Table: saved_papers (lowercase - active)
create table if not exists public.saved_papers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  paper_id text not null,
  title text not null,
  abstract text,
  url text,
  notes text,
  tags text[],
  created_at timestamp with time zone default now() not null
);

-- 2. Table: SavedPapers (legacy case-sensitive - fallback)
-- NOTE: Legacy table kept for migration safety. Use saved_papers (lowercase) going forward.

-- 3. Table: search_history
create table if not exists public.search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  vars text not null,
  year_from integer,
  year_to integer,
  min_cited integer,
  lang text,
  exclude text,
  scopus boolean default false,
  limit_count integer default 20,
  total_results integer default 0,
  sources jsonb,
  time_ms integer default 0,
  created_at timestamp with time zone default now() not null
);

-- 4. Table: rate_limits
create table if not exists public.rate_limits (
  ip text primary key,
  count integer default 0,
  window_start timestamp with time zone default now() not null
);

-- 4b. Table: search_cache
create table if not exists public.search_cache (
  query_hash text primary key,
  results jsonb not null,
  ttl_minutes integer default 60,
  created_at timestamp with time zone default now() not null
);

-- 5. Table: paper_feedback
create table if not exists public.paper_feedback (
  id uuid default gen_random_uuid() primary key,
  search_id uuid references public.search_history(id) on delete cascade not null,
  paper_doi text,
  paper_title text not null,
  lexical_score double precision default 0.0,
  citation_score double precision default 0.0,
  recency_score double precision default 0.0,
  ai_verified boolean default false,
  feedback text, -- 'up', 'down', or null
  created_at timestamp with time zone default now() not null,
  unique (search_id, paper_doi)
);

-- 6. Table: collections
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null
);

-- 7. Table: collection_papers
create table if not exists public.collection_papers (
  collection_id uuid references public.collections(id) on delete cascade not null,
  paper_id uuid references public.saved_papers(id) on delete cascade not null,
  added_at timestamp with time zone default now() not null,
  primary key (collection_id, paper_id)
);


-- ========================================================
-- ROW LEVEL SECURITY (RLS) ACTIVATION
-- ========================================================
alter table public.saved_papers enable row level security;
alter table public."SavedPapers" enable row level security;
alter table public.search_history enable row level security;
alter table public.paper_feedback enable row level security;
alter table public.collections enable row level security;
alter table public.collection_papers enable row level security;


-- ========================================================
-- RLS ACCESS POLICIES
-- ========================================================

-- Policies: saved_papers (lowercase)
drop policy if exists "Users can view own saved papers" on public.saved_papers;
drop policy if exists "Users can insert own saved papers" on public.saved_papers;
drop policy if exists "Users can delete own saved papers" on public.saved_papers;

create policy "Users can view own saved papers" on public.saved_papers for select using (auth.uid() = user_id);
create policy "Users can insert own saved papers" on public.saved_papers for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved papers" on public.saved_papers for delete using (auth.uid() = user_id);

-- Policies: SavedPapers (legacy — deprecated, use saved_papers)

-- Policies: search_history
drop policy if exists "Users can read own search history" on public.search_history;
drop policy if exists "Users can insert own search history" on public.search_history;

create policy "Users can read own search history" on public.search_history for select using (auth.uid() = user_id);
create policy "Users can insert own search history" on public.search_history for insert with check (auth.uid() = user_id);

-- Policies: paper_feedback
drop policy if exists "Users can view own search feedback" on public.paper_feedback;
drop policy if exists "Users can update own search feedback" on public.paper_feedback;

create policy "Users can view own search feedback" on public.paper_feedback for select
  using (exists (select 1 from public.search_history h where h.id = search_id and h.user_id = auth.uid()));

create policy "Users can update own search feedback" on public.paper_feedback for update
  using (exists (select 1 from public.search_history h where h.id = search_id and h.user_id = auth.uid()));

-- Policies: collections
drop policy if exists "Users can view own collections" on public.collections;
drop policy if exists "Users can insert own collections" on public.collections;
drop policy if exists "Users can update own collections" on public.collections;
drop policy if exists "Users can delete own collections" on public.collections;

create policy "Users can view own collections" on public.collections for select using (auth.uid() = user_id);
create policy "Users can insert own collections" on public.collections for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on public.collections for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on public.collections for delete using (auth.uid() = user_id);

-- Policies: collection_papers
drop policy if exists "Users can view papers in own collections" on public.collection_papers;
drop policy if exists "Users can add papers to own collections" on public.collection_papers;
drop policy if exists "Users can remove papers from own collections" on public.collection_papers;

create policy "Users can view papers in own collections" on public.collection_papers for select
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy "Users can add papers to own collections" on public.collection_papers for insert
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy "Users can remove papers from own collections" on public.collection_papers for delete
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));


-- ========================================================
-- DATABASE INDEXES FOR ACCELERATION
-- ========================================================
create index if not exists idx_saved_papers_user_id on public.saved_papers(user_id);
create index if not exists idx_search_history_user_id on public.search_history(user_id);
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collection_papers_paper_id on public.collection_papers(paper_id);
create index if not exists idx_paper_feedback_doi on public.paper_feedback(paper_doi);
