-- =============================================================================
-- CENTER PORTAL SEPARATE TABLE SETUP
-- =============================================================================
-- This migration creates a separate table for center portal users
-- to avoid confusion with the main user system

-- Step 1: Create center_users table for center portal authentication
CREATE TABLE IF NOT EXISTS public.center_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  center_name TEXT NOT NULL,
  center_type TEXT CHECK (center_type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  business_license TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Step 2: Create center_sessions table for session management
CREATE TABLE IF NOT EXISTS public.center_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  center_user_id UUID REFERENCES center_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Step 3: Update autism_centers table to link with center_users
ALTER TABLE autism_centers ADD COLUMN IF NOT EXISTS center_user_id UUID REFERENCES center_users(id);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_center_users_email ON center_users(email);
CREATE INDEX IF NOT EXISTS idx_center_users_active ON center_users(is_active);
CREATE INDEX IF NOT EXISTS idx_center_sessions_token ON center_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_center_sessions_expires ON center_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_autism_centers_center_user ON autism_centers(center_user_id);

-- Step 5: Enable RLS on new tables
ALTER TABLE center_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_sessions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for center_users
CREATE POLICY "Center users can view their own data"
  ON center_users
  FOR SELECT
  USING (true); -- We'll handle auth in the application layer

CREATE POLICY "Center users can update their own data"
  ON center_users
  FOR UPDATE
  USING (true); -- We'll handle auth in the application layer

-- Step 7: Create RLS policies for center_sessions
CREATE POLICY "Center sessions are managed by application"
  ON center_sessions
  FOR ALL
  USING (true); -- We'll handle auth in the application layer

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger for updated_at
CREATE TRIGGER update_center_users_updated_at 
    BEFORE UPDATE ON center_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_center_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM center_sessions WHERE expires_at < timezone('utc'::text, now());
END;
$$ language 'plpgsql';

COMMENT ON TABLE center_users IS 'Separate authentication table for center portal users';
COMMENT ON TABLE center_sessions IS 'Session management for center portal authentication';
COMMENT ON COLUMN autism_centers.center_user_id IS 'Links autism center to center portal user';
