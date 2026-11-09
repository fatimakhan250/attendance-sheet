-- AttendEase Supabase database setup
-- Open Supabase Dashboard -> SQL Editor -> New query, paste this file, and Run.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  roll text not null,
  created_at timestamptz not null default now(),
  unique (user_id, roll)
);

create table if not exists public.attendance (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  statuses jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.students enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "Users manage their own students" on public.students;
create policy "Users manage their own students"
on public.students for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage their own attendance" on public.attendance;
create policy "Users manage their own attendance"
on public.attendance for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists attendance_user_id_date_idx on public.attendance(user_id, date desc);
