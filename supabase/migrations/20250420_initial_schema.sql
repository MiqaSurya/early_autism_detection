-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create questionnaire_responses table
create table questionnaire_responses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  answers jsonb,
  risk_level text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table questionnaire_responses enable row level security;

-- Create policy
create policy "Users can only access their own responses"
  on questionnaire_responses
  for all
  using (auth.uid() = user_id);

-- Create saved_locations table (future feature)
create table saved_locations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  type text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table saved_locations enable row level security;

-- Create policy
create policy "Users can only access their own saved locations"
  on saved_locations
  for all
  using (auth.uid() = user_id);
