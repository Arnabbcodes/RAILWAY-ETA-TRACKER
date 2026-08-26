-- ============================================================
-- SUPABASE SCHEMA
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  origin text not null,
  destination text not null,
  distance_km numeric not null,
  speed_kmh numeric not null,
  traffic text not null check (traffic in ('low', 'medium', 'high')),
  eta_minutes integer not null,
  ai_explanation text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table trips enable row level security;

-- Allow anyone (anon key) to insert trips
create policy "Allow public insert"
  on trips for insert
  to anon
  with check (true);

-- Allow anyone (anon key) to read trips
create policy "Allow public select"
  on trips for select
  to anon
  using (true);

-- Allow anyone (anon key) to update trips (needed to attach ai_explanation after insert)
create policy "Allow public update"
  on trips for update
  to anon
  using (true)
  with check (true);
