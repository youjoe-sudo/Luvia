-- Create user role enum
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- Create profiles table (synced with auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role user_role NOT NULL DEFAULT 'student',
  browser_fingerprint text,
  last_login_ip text,
  is_active boolean DEFAULT true,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table (bilingual)
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  instructor_name_ar text,
  instructor_name_en text,
  instructor_id uuid REFERENCES profiles(id),
  price_usd numeric(10,2),
  thumbnail_url text,
  whatsapp_number text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lessons table (bilingual)
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  google_drive_video_id text,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lesson attachments table
CREATE TABLE lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- Create vouchers table
CREATE TABLE vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES profiles(id),
  generated_at timestamptz DEFAULT now(),
  is_used boolean DEFAULT false,
  used_by_user_id uuid REFERENCES profiles(id),
  used_at timestamptz,
  expiry_date date
);

-- Create user_courses table (tracks course ownership)
CREATE TABLE user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  activated_at timestamptz DEFAULT now(),
  voucher_code text,
  UNIQUE(user_id, course_id)
);

-- Create assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignment questions table
CREATE TABLE assignment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice')),
  question_text_ar text NOT NULL,
  question_text_en text NOT NULL,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create assignment question options table
CREATE TABLE assignment_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES assignment_questions(id) ON DELETE CASCADE,
  text_ar text NOT NULL,
  text_en text NOT NULL,
  is_correct boolean DEFAULT false,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(5,2),
  total_questions int,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- Create submission answers table
CREATE TABLE submission_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES assignment_questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[],
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);

-- Create comprehensive exams table
CREATE TABLE comprehensive_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam questions table (reuse structure from assignments)
CREATE TABLE exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES comprehensive_exams(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice')),
  question_text_ar text NOT NULL,
  question_text_en text NOT NULL,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create exam question options table
CREATE TABLE exam_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES exam_questions(id) ON DELETE CASCADE,
  text_ar text NOT NULL,
  text_en text NOT NULL,
  is_correct boolean DEFAULT false,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create exam submissions table
CREATE TABLE exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES comprehensive_exams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(5,2),
  total_questions int,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, user_id)
);

-- Create exam submission answers table
CREATE TABLE exam_submission_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES exam_submissions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES exam_questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[],
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);

-- Create certificates table
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  certificate_url text,
  qr_code_data text,
  issued_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create certificate template table
CREATE TABLE certificate_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  signature_text text,
  signature_font text DEFAULT 'Pacifico',
  layout text DEFAULT 'template_1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create live lectures table
CREATE TABLE live_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES profiles(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  is_active boolean DEFAULT true,
  recording_url text,
  created_at timestamptz DEFAULT now()
);

-- Create live lecture participants table
CREATE TABLE live_lecture_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES live_lectures(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_banned boolean DEFAULT false,
  UNIQUE(lecture_id, user_id)
);

-- Create chat messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES live_lectures(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

-- Create device login attempts table
CREATE TABLE device_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  old_browser_fingerprint text,
  new_browser_fingerprint text,
  old_ip_address text,
  new_ip_address text,
  attempted_at timestamptz DEFAULT now(),
  is_reviewed boolean DEFAULT false
);

-- Create settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('default_whatsapp_number', '+966501234567'),
  ('platform_name', 'Luvia');

-- Create indexes for performance
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_course ON vouchers(course_id);
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);
CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);
CREATE INDEX idx_live_lectures_course ON live_lectures(course_id);
CREATE INDEX idx_chat_messages_lecture ON chat_messages(lecture_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comprehensive_exams_updated_at BEFORE UPDATE ON comprehensive_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();