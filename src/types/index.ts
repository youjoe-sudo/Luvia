export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// User and Auth Types
export type UserRole = 'student' | 'instructor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: UserRole;
  browser_fingerprint: string | null;
  last_login_ip: string | null;
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

// Course Types
export interface Course {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  instructor_name_ar: string | null;
  instructor_name_en: string | null;
  instructor_id: string | null;
  price_usd: number | null;
  thumbnail_url: string | null;
  whatsapp_number: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type LessonType = 'video' | 'exam';

export interface Lesson {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  google_drive_video_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  lesson_type: LessonType;
  exam_questions: ExamQuestion[] | null;
  exam_duration: number | null;
  passing_score: number | null;
}

export interface ExamQuestion {
  id: string;
  question_text_ar: string;
  question_text_en: string;
  question_type: 'single_choice' | 'multiple_choice';
  options: ExamQuestionOption[];
  correct_answers: string[];
}

export interface ExamQuestionOption {
  id: string;
  text_ar: string;
  text_en: string;
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  name_ar: string;
  name_en: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

// Voucher Types
export interface Voucher {
  id: string;
  code: string;
  course_id: string;
  generated_by: string | null;
  generated_at: string;
  is_used: boolean;
  used_by_user_id: string | null;
  used_at: string | null;
  expiry_date: string | null;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  activated_at: string;
  voucher_code: string | null;
}

// Assignment Types
export interface Assignment {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  due_date: string | null;
  created_at: string;
  questions: any[]; // ضيف السطر ده هنا
  updated_at: string;
}

export type QuestionType = 'single_choice' | 'multiple_choice';

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  question_type: QuestionType;
  question_text_ar: string;
  question_text_en: string;
  order_index: number;
  created_at: string;
}

export interface AssignmentQuestionOption {
  id: string;
  question_id: string;
  text_ar: string;
  text_en: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  score: number | null;
  total_score: number | null;
  total_questions: number | null;
  submitted_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  };
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean | null;
  created_at: string;
}

// Comprehensive Exam Types
export interface ComprehensiveExam {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_type: QuestionType;
  question_text_ar: string;
  question_text_en: string;
  order_index: number;
  created_at: string;
}

export interface ExamQuestionOption {
  id: string;
  question_id: string;
  text_ar: string;
  text_en: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  user_id: string;
  score: number | null;
  total_questions: number | null;
  submitted_at: string;
}

export interface ExamSubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean | null;
  created_at: string;
}

// Certificate Types
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_url: string | null;
  qr_code_data: string | null;
  issued_at: string;
}

export interface CertificateTemplate {
  id: string;
  logo_url: string | null;
  signature_text: string | null;
  signature_font: string;
  layout: string;
  created_at: string;
  updated_at: string;
}

// Live Lecture Types
export interface LiveLecture {
  id: string;
  course_id: string;
  lesson_id: string | null;
  instructor_id: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  recording_url: string | null;
  created_at: string;
}

export interface LiveLectureParticipant {
  id: string;
  lecture_id: string;
  user_id: string;
  joined_at: string;
  is_banned: boolean;
}

export interface ChatMessage {
  id: string;
  lecture_id: string;
  user_id: string;
  message_text: string;
  sent_at: string;
}

// Device Login Tracking
export interface DeviceLoginAttempt {
  id: string;
  user_id: string;
  old_browser_fingerprint: string | null;
  new_browser_fingerprint: string | null;
  old_ip_address: string | null;
  new_ip_address: string | null;
  attempted_at: string;
  is_reviewed: boolean;
}

// Settings
export interface Setting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface CourseWithLessons extends Course {
  lessons: Lesson[];
}

export interface LessonWithAttachments extends Lesson {
  attachments: LessonAttachment[];
}

export interface AssignmentWithQuestions extends Assignment {
  questions: (AssignmentQuestion & { options: AssignmentQuestionOption[] })[];
}

export interface ExamWithQuestions extends ComprehensiveExam {
  questions: (ExamQuestion & { options: ExamQuestionOption[] })[];
}
