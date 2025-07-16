-- =============================================
-- SUPABASE EMERGENCY RECOVERY SCRIPT
-- Early Autism Detection App
-- =============================================
-- 
-- This script contains essential table structures and data
-- for emergency recovery of your Supabase database.
-- 
-- Usage:
-- 1. Copy and paste sections into Supabase SQL Editor
-- 2. Run each section separately
-- 3. Check for errors and fix as needed
--
-- =============================================

-- =============================================
-- 1. CORE USER TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. CHILDREN MANAGEMENT
-- =============================================

-- Children table
CREATE TABLE IF NOT EXISTS public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
DROP POLICY IF EXISTS "Users can manage own children" ON public.children;
CREATE POLICY "Users can manage own children" ON public.children
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 3. ASSESSMENTS SYSTEM
-- =============================================

-- Assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL DEFAULT 'mchat-r',
    questions JSONB NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'low',
    recommendations TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
DROP POLICY IF EXISTS "Users can manage own assessments" ON public.assessments;
CREATE POLICY "Users can manage own assessments" ON public.assessments
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 4. AUTISM CENTERS
-- =============================================

-- Autism centers table
CREATE TABLE IF NOT EXISTS public.autism_centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    contact_person TEXT,
    services TEXT[],
    operating_hours JSONB,
    is_verified BOOLEAN DEFAULT false,
    center_user_id UUID REFERENCES public.center_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.autism_centers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for autism centers
DROP POLICY IF EXISTS "Anyone can view verified centers" ON public.autism_centers;
CREATE POLICY "Anyone can view verified centers" ON public.autism_centers
    FOR SELECT USING (is_verified = true);

DROP POLICY IF EXISTS "Service role can manage all centers" ON public.autism_centers;
CREATE POLICY "Service role can manage all centers" ON public.autism_centers
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 5. CENTER USERS (PORTAL)
-- =============================================

-- Center users table
CREATE TABLE IF NOT EXISTS public.center_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    center_name TEXT NOT NULL,
    center_type TEXT CHECK (center_type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    services TEXT[],
    operating_hours JSONB,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.center_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for center users
DROP POLICY IF EXISTS "Centers can manage own data" ON public.center_users;
CREATE POLICY "Centers can manage own data" ON public.center_users
    FOR ALL USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Anyone can view active centers" ON public.center_users;
CREATE POLICY "Anyone can view active centers" ON public.center_users
    FOR SELECT USING (is_active = true);

-- =============================================
-- 6. CHAT HISTORY
-- =============================================

-- Chat history table
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat history
DROP POLICY IF EXISTS "Users can manage own chat history" ON public.chat_history;
CREATE POLICY "Users can manage own chat history" ON public.chat_history
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 7. SAVED LOCATIONS
-- =============================================

-- Saved locations table
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    center_id UUID REFERENCES public.autism_centers(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, center_id)
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved locations
DROP POLICY IF EXISTS "Users can manage own saved locations" ON public.saved_locations;
CREATE POLICY "Users can manage own saved locations" ON public.saved_locations
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 8. ESSENTIAL FUNCTIONS
-- =============================================

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON public.children;
CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_autism_centers_updated_at ON public.autism_centers;
CREATE TRIGGER update_autism_centers_updated_at
    BEFORE UPDATE ON public.autism_centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_center_users_updated_at ON public.center_users;
CREATE TRIGGER update_center_users_updated_at
    BEFORE UPDATE ON public.center_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_user_id ON public.children(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_child_id ON public.assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_autism_centers_location ON public.autism_centers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_autism_centers_type ON public.autism_centers(type);
CREATE INDEX IF NOT EXISTS idx_autism_centers_verified ON public.autism_centers(is_verified);
CREATE INDEX IF NOT EXISTS idx_center_users_active ON public.center_users(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);

-- =============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample autism centers (uncomment if needed)
/*
INSERT INTO public.autism_centers (name, type, address, latitude, longitude, phone, email, description, is_verified) VALUES
('KL Autism Center', 'diagnostic', 'Kuala Lumpur, Malaysia', 3.1390, 101.6869, '+60123456789', 'info@klautism.com', 'Comprehensive autism diagnostic services', true),
('Therapy Plus Center', 'therapy', 'Petaling Jaya, Malaysia', 3.1073, 101.6067, '+60123456790', 'contact@therapyplus.com', 'Specialized autism therapy programs', true),
('Special Needs Support', 'support', 'Shah Alam, Malaysia', 3.0733, 101.5185, '+60123456791', 'help@specialsupport.com', 'Family support and counseling services', true);
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these to verify your setup:

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =============================================
-- END OF EMERGENCY RECOVERY SCRIPT
-- =============================================
