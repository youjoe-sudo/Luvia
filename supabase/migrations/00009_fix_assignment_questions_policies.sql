-- إصلاح سياسات أسئلة الواجبات وخياراتها
-- Fix assignment questions and options policies

-- حذف السياسات القديمة
-- Drop old policies
DROP POLICY IF EXISTS "Admins and instructors can manage questions" ON assignment_questions;
DROP POLICY IF EXISTS "Admins and instructors can manage options" ON assignment_question_options;

-- سياسات جدول assignment_questions
-- Policies for assignment_questions table

-- سياسة الإدراج: المدراء فقط
-- Insert policy: Admins only
CREATE POLICY "Admins can insert questions" ON assignment_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- سياسة التحديث: المدراء والمدرسون
-- Update policy: Admins and instructors
CREATE POLICY "Admins and instructors can update questions" ON assignment_questions
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_questions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
  );

-- سياسة الحذف: المدراء والمدرسون
-- Delete policy: Admins and instructors
CREATE POLICY "Admins and instructors can delete questions" ON assignment_questions
  FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_questions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
  );

-- سياسات جدول assignment_question_options
-- Policies for assignment_question_options table

-- سياسة الإدراج: المدراء فقط
-- Insert policy: Admins only
CREATE POLICY "Admins can insert options" ON assignment_question_options
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- سياسة التحديث: المدراء والمدرسون
-- Update policy: Admins and instructors
CREATE POLICY "Admins and instructors can update options" ON assignment_question_options
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM assignment_questions aq
      JOIN assignments a ON a.id = aq.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE aq.id = assignment_question_options.question_id 
      AND c.instructor_id = auth.uid()
    )
  );

-- سياسة الحذف: المدراء والمدرسون
-- Delete policy: Admins and instructors
CREATE POLICY "Admins and instructors can delete options" ON assignment_question_options
  FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM assignment_questions aq
      JOIN assignments a ON a.id = aq.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE aq.id = assignment_question_options.question_id 
      AND c.instructor_id = auth.uid()
    )
  );