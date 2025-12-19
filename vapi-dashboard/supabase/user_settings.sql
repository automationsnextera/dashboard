-- Create a table for private user settings
create table user_settings (
  user_id uuid references auth.users not null primary key,
  vapi_api_key text,
  updated_at timestamptz
);

alter table user_settings enable row level security;

create policy "Users can view their own settings."
  on user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings."
  on user_settings for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own settings."
  on user_settings for update
  using ( auth.uid() = user_id );

-- Clients Table RLS Policies
-- Allow authenticated users to create a client tenant
CREATE POLICY "Users can create their own client" 
ON clients FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to update their own client details
CREATE POLICY "Users can update their own client" 
ON clients FOR UPDATE 
TO authenticated 
USING (id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
