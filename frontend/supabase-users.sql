-- Minimal users table for storing emails
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone default now()
);

-- Open permissions for now (optional tighten later)
alter table public.app_users enable row level security;
create policy "allow all select" on public.app_users for select using (true);
create policy "allow service inserts" on public.app_users for insert with check (true);