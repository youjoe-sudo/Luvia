-- إزالة القيد الفريد الصحيح من جدول الشهادات
-- Remove the correct unique constraint from certificates table

ALTER TABLE certificates 
DROP CONSTRAINT IF EXISTS certificates_user_id_course_id_key;

-- إضافة فهرس عادي (غير فريد) لتحسين الأداء
-- Add regular (non-unique) index for performance
DROP INDEX IF EXISTS idx_certificates_course_student;
CREATE INDEX idx_certificates_course_student 
ON certificates(course_id, student_id);