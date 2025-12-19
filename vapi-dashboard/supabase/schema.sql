-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clients Table
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  brand_color text,
  created_at timestamptz default now()
);

-- 2. Users Table (Extensions to auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  role text check (role in ('admin', 'client')) default 'client',
  created_at timestamptz default now()
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
create index idx_users_client_id on users(client_id);
create index idx_calls_client_id on calls(client_id);
create index idx_calls_vapi_call_id on calls(vapi_call_id);
create index idx_agents_client_id on agents(client_id);

-- RLS NOT ENABLED BY DEFAULT, SO ENABLE IT
alter table clients enable row level security;
alter table users enable row level security;
alter table agents enable row level security;
alter table calls enable row level security;

-- POLICIES

-- Helper function to get current user's client_id
-- NOTE: Depending on Supabase calling capability, we might use a scalar subquery in policies directly to avoid function overhead/complexity, 
-- but a stable function is clearer.
create or replace function get_auth_client_id()
returns uuid
language sql
security definer
as $$
  select client_id from users where id = auth.uid()
$$;

-- 1. Clients Policies
-- Users can view their own client.
create policy "Users can view their own client"
on clients for select
to authenticated
using ( id = get_auth_client_id() );

-- 2. Users Policies
-- Users can view themselves and colleagues in the same client.
create policy "Users can view colleagues"
on users for select
to authenticated
using ( client_id = get_auth_client_id() );

-- Users can update their own data? (Or admins only). Let's allow users to read only for now, update self strictly?
-- For now, just Select as requested.

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

-- Service Role / Webhook policies
-- Service role has full access by default (bypass RLS), but if we want explicit policies (e.g. if we used a specific 'service' user):
-- Supabase `service_role` key bypasses RLS automatically.
-- So we typically don't need policies for service_role unless `alter table ... force row level security` is on (it's not by default).

-- Admin Override (Optional: if 'admin' role in 'users' table means System Admin who sees all)
-- If we want a System Admin:
-- create policy "Admins view all" on clients for all using ( (select role from users where id = auth.uid()) = 'super_admin' );
-- But strict multi-tenancy usually avoids this unless necessary.
-- We will stick to Client Isolation. 'Admin' role in 'users' table likely means Client Admin.

-- Trigger for 'updated_at' on calls
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
