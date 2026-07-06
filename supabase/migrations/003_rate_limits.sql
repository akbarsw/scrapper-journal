create table if not exists public.rate_limits (
  ip text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);
