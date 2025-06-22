-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table to store additional user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create children table to store child profiles
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create assessments table to track child assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  notes TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'inconclusive'))
);

-- Create questions table for assessment questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')) NOT NULL,
  order_number INT NOT NULL,
  is_reverse_scored BOOLEAN DEFAULT FALSE
);

-- Create responses table to store answers to assessment questions
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  answer TEXT CHECK (answer IN ('yes', 'no')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (assessment_id, question_id)
);

-- Create saved_locations table for storing user's saved treatment centers
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create autism_centers table for pre-populated treatment centers
CREATE TABLE IF NOT EXISTS autism_centers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  website TEXT,
  email TEXT,
  description TEXT,
  services TEXT[], -- Array of services offered
  age_groups TEXT[], -- Array of age groups served
  insurance_accepted TEXT[], -- Array of insurance types
  rating DECIMAL(2,1), -- Rating out of 5
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email_verified)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update email_verified status when user confirms email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = TRUE
  WHERE id = NEW.id AND NEW.email_confirmed_at IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a user confirms their email
CREATE OR REPLACE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (users can only access their own profiles)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for children (users can only access their own children)
CREATE POLICY "Users can view their own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- Create policies for assessments
CREATE POLICY "Users can view their children's assessments"
  ON assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can insert assessments for their children"
  ON assessments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can update their children's assessments"
  ON assessments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = assessments.child_id
    AND children.parent_id = auth.uid()
  ));

-- Create policies for responses
CREATE POLICY "Users can view their children's responses"
  ON responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

CREATE POLICY "Users can insert responses for their children's assessments"
  ON responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments
    JOIN children ON children.id = assessments.child_id
    WHERE assessments.id = responses.assessment_id
    AND children.parent_id = auth.uid()
  ));

-- Create policies for saved_locations
CREATE POLICY "Users can view their saved locations"
  ON saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their saved locations"
  ON saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved locations"
  ON saved_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved locations"
  ON saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Add some sample questions
INSERT INTO questions (category, text, age_group, order_number, is_reverse_scored) VALUES
('Social', 'Does your child maintain eye contact during interactions?', '0-3', 1, true),
('Social', 'Does your child respond to their name when called?', '0-3', 2, true),
('Communication', 'Does your child point to objects to show interest?', '0-3', 3, true),
('Communication', 'Does your child use gestures like waving bye-bye?', '0-3', 4, true),
('Behavior', 'Does your child engage in repetitive behaviors like rocking or hand-flapping?', '0-3', 5, false),
('Behavior', 'Does your child show unusual sensitivity to certain sounds, textures, or lights?', '0-3', 6, false),
('Social', 'Does your child enjoy playing with other children?', '4-7', 1, true),
('Social', 'Can your child understand and follow social rules in games?', '4-7', 2, true),
('Communication', 'Can your child carry on a back-and-forth conversation?', '4-7', 3, true),
('Communication', 'Does your child use language in a creative or flexible way?', '4-7', 4, true),
('Behavior', 'Does your child have intense interests in specific topics?', '4-7', 5, false),
('Behavior', 'Does your child insist on specific routines or rituals?', '4-7', 6, false); 