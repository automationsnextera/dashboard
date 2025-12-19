-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clients Table
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  brand_color text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 2. Profiles Table (Extensions to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  full_name text,
  avatar_url text,
  company_name text,
  use_case text,
  role text default 'client',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint full_name_length check (char_length(full_name) >= 3)
);

-- 3. Agents Table
create table agents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  vapi_agent_id text not null,
  name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- 4. Calls Table
create table calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete set null,
  vapi_call_id text unique not null,
  status text check (status in ('started', 'completed', 'failed')) default 'started',
  duration_seconds integer,
  cost numeric,
  vapi_cost numeric,
  transcript text,
  summary text,
  sentiment jsonb,
  recording_url text,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_profiles_client_id on profiles(client_id);
create index idx_calls_client_id on calls(client_id);
create index idx_calls_vapi_call_id on calls(vapi_call_id);
create index idx_agents_client_id on agents(client_id);

-- RLS NOT ENABLED BY DEFAULT, SO ENABLE IT
alter table clients enable row level security;
alter table profiles enable row level security;
alter table agents enable row level security;
alter table calls enable row level security;

-- POLICIES

-- Helper function to get current user's client_id
create or replace function get_auth_client_id()
returns uuid
language sql
security definer
as $$
  select client_id from profiles where id = auth.uid()
$$;

-- 1. Clients Policies
-- Users can view their own client.
create policy "Users can view their own client"
on clients for select
to authenticated
using ( id = get_auth_client_id() or auth.uid() = user_id );

create policy "Allow users to insert their own clients"
on clients
for insert
with check (auth.uid() = user_id);

create policy "Allow users to update their own clients"
on clients
for update
using (auth.uid() = user_id);

-- 2. Profiles Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Agents Policies
-- Users see their client's agents.
create policy "Users view client agents"
on agents for select
to authenticated
using ( client_id = get_auth_client_id() );

-- 4. Calls Policies
-- Users see their client's calls.
create policy "Users view client calls"
on calls for select
to authenticated
using ( client_id = get_auth_client_id() );

-- Trigger for 'updated_at' on calls and profiles
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_calls_updated_at
before update on calls
for each row
execute function update_updated_at_column();

create trigger update_profiles_updated_at
before update on profiles
for each row
execute function update_updated_at_column();
