create table if not exists public."SavedPapers" (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  paper_id text not null,
  title text not null,
  abstract text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
