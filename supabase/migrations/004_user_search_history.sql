alter table public.search_history 
add column if not exists user_id uuid references auth.users(id);
