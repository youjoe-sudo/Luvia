-- إزالة قيد الفريد من جدول الشهادات للسماح بإصدار شهادات متعددة لنفس الطالب في نفس الكورس
-- Remove unique constraint from certificates table to allow multiple certificates for same student-course

ALTER TABLE certificates 
DROP CONSTRAINT IF EXISTS certificates_course_student_unique;

ALTER TABLE certificates 
DROP CONSTRAINT IF EXISTS "certificate-course-id-user-id-key";

-- إضافة فهرس عادي (غير فريد) لتحسين الأداء
-- Add regular (non-unique) index for performance
CREATE INDEX IF NOT EXISTS idx_certificates_course_student 
ON certificates(course_id, student_id);