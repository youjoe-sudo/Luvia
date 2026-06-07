-- Enable realtime for live lecture features
ALTER PUBLICATION supabase_realtime ADD TABLE live_lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE live_lecture_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create storage buckets (using SQL to define policies)
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-thumbnails', 'course-thumbnails', true),
  ('lesson-attachments', 'lesson-attachments', false),
  ('certificates', 'certificates', false),
  ('lecture-recordings', 'lecture-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course thumbnails (public)
CREATE POLICY "Anyone can view course thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins and instructors can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );

CREATE POLICY "Admins and instructors can update thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );

CREATE POLICY "Admins and instructors can delete thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );

-- Storage policies for lesson attachments (private)
CREATE POLICY "Course owners can view attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lesson-attachments'
    AND (
      is_admin(auth.uid())
      OR is_instructor(auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_courses uc
        WHERE uc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and instructors can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-attachments'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );

CREATE POLICY "Admins and instructors can delete attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-attachments'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );

-- Storage policies for certificates (private)
CREATE POLICY "Users can view their own certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Admins can upload certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates'
    AND is_admin(auth.uid())
  );

-- Storage policies for lecture recordings (private)
CREATE POLICY "Course owners can view recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lecture-recordings'
    AND (
      is_admin(auth.uid())
      OR is_instructor(auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_courses uc
        WHERE uc.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Instructors can upload recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lecture-recordings'
    AND (is_admin(auth.uid()) OR is_instructor(auth.uid()))
  );