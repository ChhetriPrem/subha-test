-- Phase 0 — Supabase project & SQL schema

-- Profiles (extends Supabase's built-in auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text unique not null,
  avatar text,
  bio text,
  country text default 'India',
  country_flag text default '🇮🇳',
  level int default 1,
  vip_level int default 0,
  svip boolean default false,
  is_verified boolean default false,
  coins int default 5000,
  diamonds int default 0,
  followers int default 0,
  following int default 0,
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name, handle, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Live streams / rooms
create table if not exists streams (
  id text primary key,
  title text not null,
  type text not null default 'video',
  mode text not null default 'multi',
  category text,
  country text,
  country_flag text,
  cover_image text,
  viewer_count int default 1,
  like_count int default 0,
  tags jsonb default '[]',
  is_hot boolean default true,
  is_recommended boolean default true,
  pinned_message text,
  host_id uuid references profiles(id) not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Chat messages (persisted + realtime)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  stream_id text references streams(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  is_gift boolean default false,
  gift_data jsonb,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table streams enable row level security;
alter table messages enable row level security;

-- Drop existing policies if re-applying
drop policy if exists "profiles are publicly readable" on profiles;
drop policy if exists "users update own profile" on profiles;
drop policy if exists "streams are publicly readable" on streams;
drop policy if exists "authenticated users create streams" on streams;
drop policy if exists "hosts update own streams" on streams;
drop policy if exists "messages are publicly readable" on messages;
drop policy if exists "authenticated users send messages" on messages;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

create policy "streams are publicly readable" on streams for select using (true);
create policy "authenticated users create streams" on streams for insert with check (auth.uid() = host_id);
create policy "hosts update own streams" on streams for update using (auth.uid() = host_id);

create policy "messages are publicly readable" on messages for select using (true);
create policy "authenticated users send messages" on messages for insert with check (auth.uid() = sender_id);

-- Enable Realtime on these tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table streams, messages;
exception
  when others then null;
end;
