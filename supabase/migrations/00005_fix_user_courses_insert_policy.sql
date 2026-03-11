-- إضافة سياسة للسماح للمستخدمين بإضافة كورسات لأنفسهم
-- Allow users to insert courses for themselves

-- حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "Users can add courses for themselves" ON user_courses;

-- إنشاء سياسة جديدة تسمح للمستخدمين بإضافة كورسات لأنفسهم فقط
-- Create new policy allowing users to add courses only for themselves
CREATE POLICY "Users can add courses for themselves" ON user_courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- يمكن للمستخدم إضافة كورس لنفسه فقط
    -- User can only add course for themselves
    user_id = auth.uid()
  );

-- التأكد من وجود سياسة القراءة
-- Ensure read policy exists
DROP POLICY IF EXISTS "Users can view their own courses" ON user_courses;

CREATE POLICY "Users can view their own courses" ON user_courses
  FOR SELECT
  TO authenticated
  USING (
    -- يمكن للمستخدم رؤية كورساته فقط
    -- User can only view their own courses
    user_id = auth.uid()
  );