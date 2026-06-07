-- إصلاح سياسات الواجبات للسماح للمدراء بإنشاء الواجبات
-- Fix assignments policies to allow admins to create assignments

-- حذف السياسة القديمة
-- Drop old policy
DROP POLICY IF EXISTS "Admins and instructors can manage assignments" ON assignments;

-- إنشاء سياسات منفصلة لكل عملية
-- Create separate policies for each operation

-- سياسة الإدراج: المدراء فقط يمكنهم إنشاء الواجبات
-- Insert policy: Only admins can create assignments
CREATE POLICY "Admins can insert assignments" ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- سياسة التحديث: المدراء والمدرسون يمكنهم تحديث الواجبات
-- Update policy: Admins and instructors can update assignments
CREATE POLICY "Admins and instructors can update assignments" ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = assignments.course_id 
      AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = assignments.course_id 
      AND c.instructor_id = auth.uid()
    )
  );

-- سياسة الحذف: المدراء والمدرسون يمكنهم حذف الواجبات
-- Delete policy: Admins and instructors can delete assignments
CREATE POLICY "Admins and instructors can delete assignments" ON assignments
  FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = assignments.course_id 
      AND c.instructor_id = auth.uid()
    )
  );