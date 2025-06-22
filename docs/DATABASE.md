# 🗄️ Database Schema Documentation

This document provides comprehensive documentation for the Early Autism Detector database schema using Supabase PostgreSQL.

## Overview

The database is designed to support:
- User authentication and profiles
- Child profile management
- M-CHAT-R assessments and responses
- Progress tracking and milestones
- Autism center location services
- AI chat history
- Intervention tracking

## Database Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │    children     │    │   assessments   │
│                 │◄───┤                 │◄───┤                 │
│ - id (UUID)     │    │ - id (UUID)     │    │ - id (UUID)     │
│ - email         │    │ - parent_id     │    │ - child_id      │
│ - created_at    │    │ - name          │    │ - score         │
└─────────────────┘    │ - date_of_birth │    │ - risk_level    │
                       │ - gender        │    └─────────────────┘
                       └─────────────────┘
```

## Core Tables

### 1. auth.users (Supabase Auth)
Built-in Supabase authentication table.

**Columns:**
- `id` (UUID, PK) - Unique user identifier
- `email` (TEXT) - User email address
- `encrypted_password` (TEXT) - Encrypted password
- `email_confirmed_at` (TIMESTAMPTZ) - Email verification timestamp
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### 2. children
Stores child profiles for assessment tracking.

```sql
CREATE TABLE children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

**Relationships:**
- `parent_id` → `auth.users.id` (Many-to-One)

**Indexes:**
- Primary key on `id`
- Index on `parent_id` for user queries

### 3. questions
M-CHAT-R assessment questions.

```sql
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')) NOT NULL,
  order_number INT NOT NULL,
  is_reverse_scored BOOLEAN DEFAULT FALSE
);
```

**Sample Data:**
```sql
INSERT INTO questions (category, text, age_group, order_number) VALUES
('social_interaction', 'Does your child enjoy being swung, bounced on your knee, etc.?', '0-3', 1),
('communication', 'Does your child take an interest in other children?', '0-3', 2);
```

### 4. assessments
Individual assessment sessions.

```sql
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  status TEXT CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INT,
  notes TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'inconclusive'))
);
```

**Relationships:**
- `child_id` → `children.id` (Many-to-One)

### 5. responses
Individual question responses within assessments.

```sql
CREATE TABLE responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  answer TEXT CHECK (answer IN ('yes', 'no')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (assessment_id, question_id)
);
```

**Relationships:**
- `assessment_id` → `assessments.id` (Many-to-One)
- `question_id` → `questions.id` (Many-to-One)

## Location Services

### 6. autism_centers
Pre-populated autism treatment centers.

```sql
CREATE TABLE autism_centers (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

**Indexes:**
- Spatial index on `(latitude, longitude)` for proximity queries
- Index on `type` for filtering
- Index on `verified` for quality filtering

### 7. saved_locations
User's saved autism centers.

```sql
CREATE TABLE saved_locations (
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
```

**Relationships:**
- `user_id` → `auth.users.id` (Many-to-One)

## Progress Tracking

### 8. milestones
Developmental milestones tracking.

```sql
CREATE TABLE milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN ('communication', 'social', 'motor', 'cognitive', 'behavioral')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_age_months INT,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### 9. interventions
Treatment and intervention tracking.

```sql
CREATE TABLE interventions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  intervention_type TEXT CHECK (intervention_type IN ('therapy', 'medication', 'educational', 'behavioral', 'dietary', 'other')) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  provider_name TEXT,
  provider_contact TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  frequency TEXT,
  goals TEXT[],
  progress_notes TEXT,
  effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### 10. progress_notes
General progress notes and observations.

```sql
CREATE TABLE progress_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) NOT NULL,
  note_type TEXT CHECK (note_type IN ('observation', 'milestone', 'concern', 'improvement', 'general')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_important BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

## Chat System

### 11. chat_history
AI chat conversation history.

```sql
CREATE TABLE chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- Index on `user_id` for user queries
- Index on `timestamp DESC` for chronological ordering

## Row Level Security (RLS)

All tables implement Row Level Security to ensure data privacy:

### Children Table
```sql
-- Users can only access their own children
CREATE POLICY children_policy ON children
  FOR ALL USING (auth.uid() = parent_id);
```

### Assessments Table
```sql
-- Users can only access assessments for their children
CREATE POLICY assessments_policy ON assessments
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );
```

### Saved Locations Table
```sql
-- Users can only access their own saved locations
CREATE POLICY saved_locations_policy ON saved_locations
  FOR ALL USING (auth.uid() = user_id);
```

### Chat History Table
```sql
-- Users can only access their own chat history
CREATE POLICY chat_history_policy ON chat_history
  FOR ALL USING (auth.uid() = user_id);
```

## Database Functions

### Calculate Assessment Score
```sql
CREATE OR REPLACE FUNCTION calculate_assessment_score(assessment_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  response_record RECORD;
BEGIN
  FOR response_record IN
    SELECT r.answer, q.is_reverse_scored
    FROM responses r
    JOIN questions q ON r.question_id = q.id
    WHERE r.assessment_id = assessment_uuid
  LOOP
    IF (response_record.answer = 'yes' AND NOT response_record.is_reverse_scored) OR
       (response_record.answer = 'no' AND response_record.is_reverse_scored) THEN
      total_score := total_score + 1;
    END IF;
  END LOOP;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;
```

### Distance Calculation
```sql
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;
```

## Setup Instructions

### 1. Initial Setup
Run the main setup script:
```bash
psql -f supabase_setup.sql
```

### 2. Add Progress Tracking
```bash
psql -f add_progress_tables.sql
```

### 3. Add Autism Centers
```bash
psql -f supabase/migrations/20250621_add_autism_centers.sql
```

### 4. Add Chat History
```bash
psql -f create_chat_history_table.sql
```

### 5. Populate Sample Data
```bash
psql -f sample_autism_centers.sql
```

## Backup and Maintenance

### Regular Backups
```bash
# Full database backup
pg_dump -h your-host -U postgres your-db > backup.sql

# Schema only
pg_dump -h your-host -U postgres -s your-db > schema.sql
```

### Performance Monitoring
- Monitor query performance with `EXPLAIN ANALYZE`
- Check index usage with `pg_stat_user_indexes`
- Monitor table sizes with `pg_size_pretty(pg_total_relation_size('table_name'))`

### Data Retention
- Chat history: 1 year retention policy
- Assessment data: Permanent retention
- Progress notes: Permanent retention
- Audit logs: 2 year retention
