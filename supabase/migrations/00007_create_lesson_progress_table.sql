-- إنشاء جدول تتبع تقدم الطلاب في الدروس
-- Create lesson progress tracking table

CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- منع تكرار السجلات لنفس المستخدم والدرس
  -- Prevent duplicate records for same user and lesson
  UNIQUE(user_id, lesson_id)
);

-- إنشاء فهارس لتحسين الأداء
-- Create indexes for performance
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(is_completed) WHERE is_completed = true;

-- تفعيل RLS
-- Enable RLS
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدمون يمكنهم رؤية تقدمهم الخاص فقط
-- Read policy: Users can only view their own progress
CREATE POLICY "Users can view their own progress" ON lesson_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسة الإدراج: المستخدمون يمكنهم إضافة تقدمهم الخاص فقط
-- Insert policy: Users can only insert their own progress
CREATE POLICY "Users can insert their own progress" ON lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- سياسة التحديث: المستخدمون يمكنهم تحديث تقدمهم الخاص فقط
-- Update policy: Users can only update their own progress
CREATE POLICY "Users can update their own progress" ON lesson_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- سياسة المدراء: الوصول الكامل
-- Admin policy: Full access
CREATE POLICY "Admins have full access to lesson progress" ON lesson_progress
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- دالة لتحديث updated_at تلقائياً
-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تفعيل التحديث التلقائي
-- Enable automatic update
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_updated_at();

-- إضافة تعليقات توضيحية
-- Add comments
COMMENT ON TABLE lesson_progress IS 'تتبع تقدم الطلاب في إكمال الدروس';
COMMENT ON COLUMN lesson_progress.user_id IS 'معرف الطالب';
COMMENT ON COLUMN lesson_progress.lesson_id IS 'معرف الدرس';
COMMENT ON COLUMN lesson_progress.is_completed IS 'هل تم إكمال الدرس';
COMMENT ON COLUMN lesson_progress.completed_at IS 'تاريخ ووقت إكمال الدرس';