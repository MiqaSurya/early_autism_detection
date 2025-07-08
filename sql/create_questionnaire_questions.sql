-- Create questionnaire_questions table for admin-managed M-CHAT-R questions
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social_communication', 'behavior_sensory')),
  risk_answer TEXT NOT NULL CHECK (risk_answer IN ('yes', 'no')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_active ON questionnaire_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_number ON questionnaire_questions(question_number);

-- Enable RLS (Row Level Security)
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users (admin access)
CREATE POLICY "Allow all operations for authenticated users" ON questionnaire_questions
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default M-CHAT-R questions
INSERT INTO questionnaire_questions (question_number, text, category, risk_answer, is_active) VALUES
(1, 'If you point at something across the room, does your child look at it?', 'social_communication', 'no', true),
(2, 'Have you ever wondered if your child is deaf?', 'behavior_sensory', 'yes', true),
(3, 'Does your child play pretend or make-believe?', 'social_communication', 'no', true),
(4, 'Does your child like climbing on things?', 'behavior_sensory', 'no', true),
(5, 'Does your child make unusual finger movements near his or her eyes?', 'behavior_sensory', 'yes', true),
(6, 'Does your child point with one finger to ask for something or to get help?', 'social_communication', 'no', true),
(7, 'Does your child point with one finger to show you something interesting?', 'social_communication', 'no', true),
(8, 'Is your child interested in other children?', 'social_communication', 'no', true),
(9, 'Does your child show you things by bringing them to you or holding them up for you to see?', 'social_communication', 'no', true),
(10, 'Does your child respond when you call his or her name?', 'social_communication', 'no', true),
(11, 'When you smile at your child, does he or she smile back at you?', 'social_communication', 'no', true),
(12, 'Does your child get upset by everyday noises?', 'behavior_sensory', 'yes', true),
(13, 'Does your child walk?', 'behavior_sensory', 'no', true),
(14, 'Does your child look you in the eye when you are talking to him or her?', 'social_communication', 'no', true),
(15, 'Does your child try to copy what you do?', 'social_communication', 'no', true),
(16, 'If you turn your head to look at something, does your child look around to see what you are looking at?', 'social_communication', 'no', true),
(17, 'Does your child try to get you to watch him or her?', 'social_communication', 'no', true),
(18, 'Does your child understand when you tell him or her to do something?', 'social_communication', 'no', true),
(19, 'If something new happens, does your child look at your face to see how you feel about it?', 'social_communication', 'no', true),
(20, 'Does your child like movement activities?', 'behavior_sensory', 'no', true)
ON CONFLICT DO NOTHING;
