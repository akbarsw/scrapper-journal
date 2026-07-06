-- Buat tabel jika belum ada (sesuaikan dengan skema aktual jika sudah ada)
create table if not exists public.saved_papers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  paper_id text not null,
  title text not null,
  abstract text,
  url text,
  created_at timestamptz default now() not null
);

alter table public.saved_papers enable row level security;

create policy "Users can view own saved papers"
  on public.saved_papers for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved papers"
  on public.saved_papers for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved papers"
  on public.saved_papers for delete
  using (auth.uid() = user_id);
