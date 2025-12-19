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
