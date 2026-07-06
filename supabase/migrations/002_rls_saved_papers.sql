alter table public."SavedPapers" enable row level security;

create policy "Users can view own saved papers"
  on public."SavedPapers" for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved papers"
  on public."SavedPapers" for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved papers"
  on public."SavedPapers" for delete
  using (auth.uid() = user_id);
