-- Create questions table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('0-3', '4-7', '8-12', '13-18')),
  is_reverse_scored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create answers table to store user responses
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  answer TEXT NOT NULL CHECK (answer IN ('yes', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id, question_id)
);

-- Insert all questions
INSERT INTO questions (id, text, age_group, is_reverse_scored) VALUES
  -- Ages 0-3
  (1, 'Does your child respond to their name?', '0-3', false),
  (2, 'Does your child make eye contact?', '0-3', false),
  (3, 'Does your child point to objects to show interest?', '0-3', false),
  (4, 'Does your child wave goodbye or use other gestures?', '0-3', false),
  (5, 'Does your child smile back when smiled at?', '0-3', false),
  (6, 'Does your child enjoy playing social games (peek-a-boo, etc.)?', '0-3', false),
  (7, 'Does your child avoid looking at people''s faces?', '0-3', true),
  (8, 'Does your child show interest in other children?', '0-3', false),
  (9, 'Does your child imitate others (e.g., sounds, actions)?', '0-3', false),
  (10, 'Does your child bring objects to share with you?', '0-3', false),
  
  -- Ages 4-7
  (11, 'Does your child struggle with making friends?', '4-7', true),
  (12, 'Does your child repeat the same phrases or questions over and over?', '4-7', true),
  (13, 'Does your child engage in pretend play (e.g., pretending to cook)?', '4-7', false),
  (14, 'Does your child become very upset when routines change?', '4-7', true),
  (15, 'Does your child focus intensely on a specific topic or object?', '4-7', true),
  (16, 'Does your child avoid eye contact during conversation?', '4-7', true),
  (17, 'Does your child speak in a flat or unusual tone?', '4-7', true),
  (18, 'Does your child flap hands, rock, or spin frequently?', '4-7', true),
  (19, 'Does your child have sensory issues (e.g., dislikes certain textures)?', '4-7', true),
  (20, 'Does your child ask questions to gain information (not just repeating)?', '4-7', false),
  
  -- Ages 8-12
  (21, 'Does your child struggle to understand jokes or sarcasm?', '8-12', true),
  (22, 'Does your child have difficulty understanding others'' feelings?', '8-12', true),
  (23, 'Does your child prefer to play alone rather than with peers?', '8-12', true),
  (24, 'Does your child take things literally (e.g., not understand figurative language)?', '8-12', true),
  (25, 'Does your child fixate on specific interests and talk about them excessively?', '8-12', true),
  (26, 'Does your child have trouble with back-and-forth conversations?', '8-12', true),
  (27, 'Does your child follow a strict routine and get upset if it changes?', '8-12', true),
  (28, 'Does your child show intense interest in certain objects or topics?', '8-12', true),
  (29, 'Does your child avoid group activities or team sports?', '8-12', true),
  (30, 'Does your child become overwhelmed by loud sounds or bright lights?', '8-12', true),
  
  -- Ages 13-18
  (31, 'Does your teen avoid social interactions or group settings?', '13-18', true),
  (32, 'Does your teen find it hard to understand social cues or body language?', '13-18', true),
  (33, 'Does your teen express difficulty in forming or keeping friendships?', '13-18', true),
  (34, 'Does your teen talk at length about their interests without noticing others'' reactions?', '13-18', true),
  (35, 'Does your teen appear anxious or upset in unfamiliar environments?', '13-18', true),
  (36, 'Does your teen struggle with organization or transitions?', '13-18', true),
  (37, 'Does your teen seem unaware of how their behavior affects others?', '13-18', true),
  (38, 'Does your teen get stuck on specific topics or routines?', '13-18', true),
  (39, 'Does your teen prefer communicating through writing or online rather than in person?', '13-18', true),
  (40, 'Does your teen report feeling "different" or "out of place" socially?', '13-18', true);

-- Create RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated users
CREATE POLICY "Questions are readable by all authenticated users"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Answers can be inserted and read by the assessment owner
CREATE POLICY "Answers can be managed by assessment owner"
  ON answers FOR ALL
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE assessments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE assessments.user_id = auth.uid()
    )
  );
