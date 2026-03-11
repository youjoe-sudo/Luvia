-- إضافة نوع الدرس (فيديو أو امتحان)
-- Add lesson type (video or exam)

-- إنشاء نوع enum لنوع الدرس
CREATE TYPE lesson_type AS ENUM ('video', 'exam');

-- إضافة عمود lesson_type إلى جدول lessons
ALTER TABLE lessons
ADD COLUMN lesson_type lesson_type DEFAULT 'video' NOT NULL;

-- إضافة عمود exam_questions لتخزين أسئلة الامتحان (JSON)
ALTER TABLE lessons
ADD COLUMN exam_questions jsonb DEFAULT NULL;

-- إضافة عمود exam_duration لمدة الامتحان بالدقائق
ALTER TABLE lessons
ADD COLUMN exam_duration integer DEFAULT NULL;

-- إضافة عمود passing_score للدرجة المطلوبة للنجاح
ALTER TABLE lessons
ADD COLUMN passing_score integer DEFAULT NULL;

-- تحديث google_drive_video_id ليكون اختياري للدروس من نوع امتحان
ALTER TABLE lessons
ALTER COLUMN google_drive_video_id DROP NOT NULL;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN lessons.lesson_type IS 'نوع الدرس: video للدروس العادية، exam للامتحانات الشاملة';
COMMENT ON COLUMN lessons.exam_questions IS 'أسئلة الامتحان بصيغة JSON (للدروس من نوع exam فقط)';
COMMENT ON COLUMN lessons.exam_duration IS 'مدة الامتحان بالدقائق (للدروس من نوع exam فقط)';
COMMENT ON COLUMN lessons.passing_score IS 'الدرجة المطلوبة للنجاح (للدروس من نوع exam فقط)';