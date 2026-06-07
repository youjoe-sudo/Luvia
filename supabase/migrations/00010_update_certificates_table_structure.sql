-- تحديث جدول الشهادات ليتوافق مع المتطلبات
-- Update certificates table to match requirements

-- إضافة الأعمدة المطلوبة
-- Add required columns
ALTER TABLE certificates 
  ADD COLUMN IF NOT EXISTS student_full_name TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS instructor_signature_text TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- إعادة تسمية user_id إلى student_id للوضوح
-- Rename user_id to student_id for clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE certificates RENAME COLUMN user_id TO student_id;
  END IF;
END $$;

-- إضافة قيود فريدة
-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certificates_course_student_unique'
  ) THEN
    ALTER TABLE certificates 
      ADD CONSTRAINT certificates_course_student_unique 
      UNIQUE(course_id, student_id);
  END IF;
END $$;

-- إنشاء فهارس إذا لم تكن موجودة
-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);

-- تحديث السياسات
-- Update policies
DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;
DROP POLICY IF EXISTS "Students can view own certificates" ON certificates;

-- المدراء يمكنهم إدارة جميع الشهادات
-- Admins can manage all certificates
CREATE POLICY "Admins can manage certificates" ON certificates
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- الطلاب يمكنهم رؤية شهاداتهم فقط
-- Students can view their own certificates only
CREATE POLICY "Students can view own certificates" ON certificates
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- إضافة trigger للتحديث التلقائي
-- Add trigger for auto-update
DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();