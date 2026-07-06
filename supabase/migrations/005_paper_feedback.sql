create table if not exists public.paper_feedback (
  id uuid default gen_random_uuid() primary key,
  search_id uuid references public.search_history(id),
  paper_doi text,
  paper_title text,
  lexical_score numeric,
  citation_score numeric,
  recency_score numeric,
  ai_verified boolean,
  final_rank_position int,
  feedback text check (feedback in ('up','down')),
  created_at timestamptz default now()
);
