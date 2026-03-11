-- Create auth trigger to sync users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'student'::user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role IN ('instructor'::user_role, 'admin'::user_role)
  );
$$;

-- Helper function to check if user owns a course
CREATE OR REPLACE FUNCTION user_owns_course(uid uuid, cid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_courses uc
    WHERE uc.user_id = uid AND uc.course_id = cid
  );
$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehensive_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_lecture_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Public view for profiles
CREATE VIEW public_profiles AS
  SELECT id, name, role FROM profiles;

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true OR is_admin(auth.uid()) OR instructor_id = auth.uid());

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Instructors can manage their courses" ON courses
  FOR ALL TO authenticated USING (instructor_id = auth.uid());

-- Lessons policies
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND c.is_published = true)
    OR is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all lessons" ON lessons
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Instructors can manage their course lessons" ON lessons
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND c.instructor_id = auth.uid())
  );

-- Lesson attachments policies
CREATE POLICY "Users who own course can view attachments" ON lesson_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN user_courses uc ON uc.course_id = l.course_id
      WHERE l.id = lesson_attachments.lesson_id AND uc.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_attachments.lesson_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins and instructors can manage attachments" ON lesson_attachments
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_attachments.lesson_id AND c.instructor_id = auth.uid()
    )
  );

-- Vouchers policies
CREATE POLICY "Admins can manage all vouchers" ON vouchers
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Instructors can view their course vouchers" ON vouchers
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = vouchers.course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "Students can view unused vouchers" ON vouchers
  FOR SELECT TO authenticated USING (is_used = false);

CREATE POLICY "Students can update vouchers when redeeming" ON vouchers
  FOR UPDATE TO authenticated USING (is_used = false AND expiry_date >= CURRENT_DATE)
  WITH CHECK (used_by_user_id = auth.uid());

-- User courses policies
CREATE POLICY "Users can view their own courses" ON user_courses
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all user courses" ON user_courses
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Assignments policies
CREATE POLICY "Users who own course can view assignments" ON assignments
  FOR SELECT TO authenticated USING (
    user_owns_course(auth.uid(), course_id)
    OR is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "Admins and instructors can manage assignments" ON assignments
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid())
  );

-- Assignment questions policies
CREATE POLICY "Users who own course can view questions" ON assignment_questions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_questions.assignment_id
      AND (user_owns_course(auth.uid(), a.course_id) OR is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id AND c.instructor_id = auth.uid()))
    )
  );

CREATE POLICY "Admins and instructors can manage questions" ON assignment_questions
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_questions.assignment_id AND c.instructor_id = auth.uid()
    )
  );

-- Assignment question options policies
CREATE POLICY "Users who own course can view options" ON assignment_question_options
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM assignment_questions aq
      JOIN assignments a ON a.id = aq.assignment_id
      WHERE aq.id = assignment_question_options.question_id
      AND (user_owns_course(auth.uid(), a.course_id) OR is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id AND c.instructor_id = auth.uid()))
    )
  );

CREATE POLICY "Admins and instructors can manage options" ON assignment_question_options
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignment_questions aq
      JOIN assignments a ON a.id = aq.assignment_id
      JOIN courses c ON c.id = a.course_id
      WHERE aq.id = assignment_question_options.question_id AND c.instructor_id = auth.uid()
    )
  );

-- Assignment submissions policies
CREATE POLICY "Users can view their own submissions" ON assignment_submissions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own submissions" ON assignment_submissions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Submission answers policies
CREATE POLICY "Users can view their own answers" ON submission_answers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM assignment_submissions sub
      WHERE sub.id = submission_answers.submission_id
      AND (sub.user_id = auth.uid() OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM assignments a
        JOIN courses c ON c.id = a.course_id
        WHERE a.id = sub.assignment_id AND c.instructor_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert their own answers" ON submission_answers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_submissions sub
      WHERE sub.id = submission_answers.submission_id AND sub.user_id = auth.uid()
    )
  );

-- Similar policies for comprehensive exams (reusing assignment logic)
CREATE POLICY "Users who own course can view exams" ON comprehensive_exams
  FOR SELECT TO authenticated USING (
    user_owns_course(auth.uid(), course_id)
    OR is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = comprehensive_exams.course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "Admins and instructors can manage exams" ON comprehensive_exams
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = comprehensive_exams.course_id AND c.instructor_id = auth.uid())
  );

-- Exam questions policies
CREATE POLICY "Users who own course can view exam questions" ON exam_questions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM comprehensive_exams e
      WHERE e.id = exam_questions.exam_id
      AND (user_owns_course(auth.uid(), e.course_id) OR is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid()))
    )
  );

CREATE POLICY "Admins and instructors can manage exam questions" ON exam_questions
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM comprehensive_exams e
      JOIN courses c ON c.id = e.course_id
      WHERE e.id = exam_questions.exam_id AND c.instructor_id = auth.uid()
    )
  );

-- Exam question options policies
CREATE POLICY "Users who own course can view exam options" ON exam_question_options
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM exam_questions eq
      JOIN comprehensive_exams e ON e.id = eq.exam_id
      WHERE eq.id = exam_question_options.question_id
      AND (user_owns_course(auth.uid(), e.course_id) OR is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid()))
    )
  );

CREATE POLICY "Admins and instructors can manage exam options" ON exam_question_options
  FOR ALL TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM exam_questions eq
      JOIN comprehensive_exams e ON e.id = eq.exam_id
      JOIN courses c ON c.id = e.course_id
      WHERE eq.id = exam_question_options.question_id AND c.instructor_id = auth.uid()
    )
  );

-- Exam submissions policies
CREATE POLICY "Users can view their own exam submissions" ON exam_submissions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM comprehensive_exams e
      JOIN courses c ON c.id = e.course_id
      WHERE e.id = exam_submissions.exam_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own exam submissions" ON exam_submissions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Exam submission answers policies
CREATE POLICY "Users can view their own exam answers" ON exam_submission_answers
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM exam_submissions sub
      WHERE sub.id = exam_submission_answers.submission_id
      AND (sub.user_id = auth.uid() OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM comprehensive_exams e
        JOIN courses c ON c.id = e.course_id
        WHERE e.id = sub.exam_id AND c.instructor_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert their own exam answers" ON exam_submission_answers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_submissions sub
      WHERE sub.id = exam_submission_answers.submission_id AND sub.user_id = auth.uid()
    )
  );

-- Certificates policies
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all certificates" ON certificates
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Certificate template policies
CREATE POLICY "Anyone can view certificate template" ON certificate_template
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage certificate template" ON certificate_template
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Live lectures policies
CREATE POLICY "Users who own course can view live lectures" ON live_lectures
  FOR SELECT TO authenticated USING (
    user_owns_course(auth.uid(), course_id)
    OR is_admin(auth.uid())
    OR instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can manage their live lectures" ON live_lectures
  FOR ALL TO authenticated USING (instructor_id = auth.uid() OR is_admin(auth.uid()));

-- Live lecture participants policies
CREATE POLICY "Participants can view lecture participants" ON live_lecture_participants
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM live_lectures ll WHERE ll.id = live_lecture_participants.lecture_id AND ll.instructor_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can join lectures" ON live_lecture_participants
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can manage participants" ON live_lecture_participants
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM live_lectures ll WHERE ll.id = live_lecture_participants.lecture_id AND ll.instructor_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- Chat messages policies
CREATE POLICY "Lecture participants can view chat" ON chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM live_lecture_participants llp
      WHERE llp.lecture_id = chat_messages.lecture_id AND llp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM live_lectures ll WHERE ll.id = chat_messages.lecture_id AND ll.instructor_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Lecture participants can send messages" ON chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM live_lecture_participants llp
      WHERE llp.lecture_id = chat_messages.lecture_id AND llp.user_id = auth.uid() AND llp.is_banned = false
    )
  );

-- Device login attempts policies
CREATE POLICY "Users can view their own login attempts" ON device_login_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own login attempts" ON device_login_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all login attempts" ON device_login_attempts
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Settings policies
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO authenticated USING (is_admin(auth.uid()));