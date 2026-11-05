-- Postgres (Supabase) port of the MySQL schema. Run in Supabase SQL editor.
-- RLS is on with no policies: only the backend (service role key) can touch the tables.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  notifications_count smallint not null default 5 check (notifications_count between 1 and 10),
  wake_time time not null default '07:00',
  sleep_time time not null default '23:00',
  timezone text not null default 'Europe/Warsaw',
  notifications_enabled boolean not null default false,
  gps_enabled boolean not null default false,
  push_token text,
  is_onboarded boolean not null default false
);

create table categories (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  color text not null default '#4F46E5',
  archived boolean not null default false,
  unique (user_id, name)
);

create table checkins (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  category_id bigint references categories on delete set null,
  description text,
  mood smallint check (mood between 1 and 5),
  energy_level smallint check (energy_level between 0 and 100),
  latitude double precision,
  longitude double precision,
  status text not null default 'queued' check (status in ('queued', 'sent', 'done', 'deleted')),
  is_manual boolean not null default false,
  scheduled_at timestamptz not null,
  completed_at timestamptz
);
create index on checkins (user_id, status, scheduled_at);
create index on checkins (status, scheduled_at);

create table insights (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  description text not null,
  structured_data jsonb,
  from_date date not null,
  to_date date not null,
  created_at timestamptz not null default now()
);
create index on insights (user_id, created_at desc);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table checkins enable row level security;
alter table insights enable row level security;
