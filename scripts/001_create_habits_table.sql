-- Create habits table with RLS
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'green',
  position integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create completions table to track daily habit completions
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, date)
);

-- Enable RLS
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

-- RLS Policies for habits
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- RLS Policies for habit_completions
create policy "Users can view their own completions"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completions"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own completions"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habit_completions_user_id_idx on public.habit_completions(user_id);
create index if not exists habit_completions_date_idx on public.habit_completions(date);
