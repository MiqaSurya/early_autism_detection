-- SQL script to create the chat_history table in Supabase

-- Create the chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to the table
COMMENT ON TABLE public.chat_history IS 'Stores chat interactions between users and the AI assistant';

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS chat_history_user_id_idx ON public.chat_history(user_id);

-- Create an index on timestamp for sorting
CREATE INDEX IF NOT EXISTS chat_history_timestamp_idx ON public.chat_history(timestamp DESC);

-- Set up Row Level Security (RLS) policies
-- Enable RLS on the table
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to select only their own chat history
CREATE POLICY chat_history_select_policy 
  ON public.chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a policy that allows users to insert only their own chat history
CREATE POLICY chat_history_insert_policy 
  ON public.chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.chat_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.chat_history_id_seq TO authenticated;
