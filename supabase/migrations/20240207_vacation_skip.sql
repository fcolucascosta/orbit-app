-- 1. Férias
create table if not exists vacations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  start_date date not null,
  end_date date not null
);

-- 2. Pular Dia
create table if not exists habit_skips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  habit_id uuid references habits(id) not null,
  date date not null,
  unique(habit_id, date)
);
