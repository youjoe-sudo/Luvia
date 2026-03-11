import { supabase } from './supabase';
import type {
  Profile,
  Course,
  Lesson,
  LessonAttachment,
  Voucher,
  UserCourse,
  Assignment,
  AssignmentQuestion,
  AssignmentQuestionOption,
  AssignmentSubmission,
  SubmissionAnswer,
  ComprehensiveExam,
  ExamQuestion,
  ExamQuestionOption,
  ExamSubmission,
  Certificate,
  CertificateTemplate,
  LiveLecture,
  LiveLectureParticipant,
  ChatMessage,
  DeviceLoginAttempt,
  Setting,
  CourseWithLessons,
  AssignmentWithQuestions,
} from '@/types';

// ==================== Profile APIs ====================
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
}

export async function getAllProfiles(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ==================== Device Fingerprint APIs ====================
// تحديث بصمة الجهاز وعنوان IP للمستخدم
// Update device fingerprint and IP address for user
export async function updateDeviceFingerprint(userId: string, fingerprint: string, ipAddress: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      browser_fingerprint: fingerprint,
      last_ip_address: ipAddress,
    })
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// تسجيل محاولة تسجيل دخول من جهاز جديد
// Log login attempt from new device
export async function logDeviceLoginAttempt(
  userId: string,
  oldFingerprint: string | null,
  newFingerprint: string,
  oldIp: string | null,
  newIp: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('device_login_attempts')
    .insert({
      user_id: userId,
      user_name: profile?.name || 'Unknown',
      user_email: profile?.email || 'Unknown',
      old_browser_fingerprint: oldFingerprint,
      new_browser_fingerprint: newFingerprint,
      old_ip_address: oldIp,
      new_ip_address: newIp,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

// الحصول على جميع محاولات تسجيل الدخول من أجهزة جديدة
// Get all login attempts from new devices
export async function getAllDeviceLoginAttempts() {
  const { data, error } = await supabase
    .from('device_login_attempts')
    .select('*')
    .order('attempted_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ==================== Course APIs ====================
export async function getAllCourses(publishedOnly = true) {
  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (publishedOnly) {
    query = query.eq('is_published', true);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getCourseById(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Course | null;
}

export async function getCourseWithLessons(courseId: string) {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();
  
  if (courseError) throw courseError;
  if (!course) return null;
  
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (lessonsError) throw lessonsError;
  
  return {
    ...course,
    lessons: Array.isArray(lessons) ? lessons : [],
  } as CourseWithLessons;
}

export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(courseId: string, updates: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  
  if (error) throw error;
}

// ==================== Lesson APIs ====================
export async function getLessonsByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getLessonById(lessonId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Lesson | null;
}

export async function createLesson(lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(lessonId: string, updates: Partial<Lesson>) {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Lesson;
}

export async function deleteLesson(lessonId: string) {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);
  
  if (error) throw error;
}

// ==================== Lesson Attachment APIs ====================
export async function getLessonAttachments(lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_attachments')
    .select('*')
    .eq('lesson_id', lessonId);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createLessonAttachment(attachment: Omit<LessonAttachment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('lesson_attachments')
    .insert(attachment)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as LessonAttachment;
}

export async function deleteLessonAttachment(attachmentId: string) {
  const { error } = await supabase
    .from('lesson_attachments')
    .delete()
    .eq('id', attachmentId);
  
  if (error) throw error;
}

// ==================== Voucher APIs ====================
export async function generateVoucher(courseId: string, expiryDate?: string) {
  const code = `LUV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const { data, error } = await supabase
    .from('vouchers')
    .insert({
      code,
      course_id: courseId,
      expiry_date: expiryDate || null,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Voucher;
}

export async function getVouchersByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('course_id', courseId)
    .order('generated_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function redeemVoucher(code: string, userId: string) {
  // First, check if voucher exists and is valid
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .eq('is_used', false)
    .maybeSingle();
  
  if (voucherError) throw voucherError;
  if (!voucher) throw new Error('كود غير صالح أو مستخدم بالفعل');
  
  // Check expiry
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
    throw new Error('انتهت صلاحية الكود');
  }
  
  // Check if user already owns the course
  const { data: existingCourse } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', voucher.course_id)
    .maybeSingle();
  
  if (existingCourse) {
    throw new Error('أنت تمتلك هذا الكورس بالفعل');
  }
  
  // Mark voucher as used
  const { error: updateError } = await supabase
    .from('vouchers')
    .update({
      is_used: true,
      used_by_user_id: userId,
      used_at: new Date().toISOString(),
    })
    .eq('code', code);
  
  if (updateError) throw updateError;
  
  // Add course to user's courses
  const { data: userCourse, error: userCourseError } = await supabase
    .from('user_courses')
    .insert({
      user_id: userId,
      course_id: voucher.course_id,
      voucher_code: code,
    })
    .select()
    .maybeSingle();
  
  if (userCourseError) throw userCourseError;
  return userCourse as UserCourse;
}

// ==================== User Course APIs ====================
export async function getUserCourses(userId: string) {
  const { data, error } = await supabase
    .from('user_courses')
    .select('*, courses(*)')
    .eq('user_id', userId)
    .order('activated_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function checkUserOwnsCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
}

// ==================== Assignment APIs ====================
export async function getAssignmentsByLesson(lessonId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('lesson_id', lessonId);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAssignmentWithQuestions(assignmentId: string) {
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .maybeSingle();
  
  if (assignmentError) throw assignmentError;
  if (!assignment) return null;
  
  const { data: questions, error: questionsError } = await supabase
    .from('assignment_questions')
    .select('*, assignment_question_options(*)')
    .eq('assignment_id', assignmentId)
    .order('order_index', { ascending: true });
  
  if (questionsError) throw questionsError;
  
  const formattedQuestions = Array.isArray(questions) ? questions.map(q => ({
    ...q,
    options: Array.isArray(q.assignment_question_options) 
      ? q.assignment_question_options.sort((a: any, b: any) => a.order_index - b.order_index)
      : [],
  })) : [];
  
  return {
    ...assignment,
    questions: formattedQuestions,
  } as AssignmentWithQuestions;
}

export async function createAssignment(
  assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'> & {
    questions?: Array<{
      question_ar: string;
      question_en: string;
      type: 'single' | 'multiple';
      options: Array<{ text_ar: string; text_en: string }>;
      correct_answers: number[];
    }>;
  }
) {
  console.log('createAssignment called with:', assignment);
  
  // إنشاء الواجب أولاً
  // Create assignment first
  const { questions, ...assignmentData } = assignment;
  
  console.log('Inserting assignment data:', assignmentData);
  
  const { data: assignmentRecord, error: assignmentError } = await supabase
    .from('assignments')
    .insert(assignmentData)
    .select()
    .maybeSingle();
  
  if (assignmentError) {
    console.error('Assignment insert error:', assignmentError);
    throw assignmentError;
  }
  if (!assignmentRecord) {
    console.error('No assignment record returned');
    throw new Error('فشل إنشاء الواجب');
  }

  console.log('Assignment created:', assignmentRecord);

  // إذا كانت هناك أسئلة، أضفها
  // If there are questions, add them
  if (questions && questions.length > 0) {
    console.log('Adding questions:', questions.length);
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      console.log(`Creating question ${i + 1}:`, question);
      
      // إنشاء السؤال
      // Create question
      const { data: questionRecord, error: questionError } = await supabase
        .from('assignment_questions')
        .insert({
          assignment_id: assignmentRecord.id,
          question_text_ar: question.question_ar,
          question_text_en: question.question_en,
          question_type: question.type === 'single' ? 'single_choice' : 'multiple_choice',
          order_index: i,
        })
        .select()
        .maybeSingle();
      
      if (questionError) {
        console.error('Question insert error:', questionError);
        throw questionError;
      }
      if (!questionRecord) {
        console.error('No question record returned');
        throw new Error('فشل إنشاء السؤال');
      }

      console.log('Question created:', questionRecord);

      // إنشاء الخيارات
      // Create options
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        const isCorrect = question.correct_answers.includes(j);
        
        console.log(`Creating option ${j + 1} for question ${i + 1}:`, option, 'isCorrect:', isCorrect);
        
        const { error: optionError } = await supabase
          .from('assignment_question_options')
          .insert({
            question_id: questionRecord.id,
            text_ar: option.text_ar,
            text_en: option.text_en,
            is_correct: isCorrect,
            order_index: j,
          });
        
        if (optionError) {
          console.error('Option insert error:', optionError);
          throw optionError;
        }
      }
    }
  }

  console.log('Assignment creation completed successfully');
  return assignmentRecord as Assignment;
}

export async function submitAssignment(
  assignmentId: string,
  userId: string,
  answers: { question_id: string; selected_option_ids: string[] }[]
) {
  // Get assignment with questions
  const assignment = await getAssignmentWithQuestions(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  
  // Calculate score
  let correctCount = 0;
  const answersWithCorrectness = answers.map(answer => {
    const question = assignment.questions.find(q => q.id === answer.question_id);
    if (!question) return { ...answer, is_correct: false };
    
    const correctOptionIds = question.options
      .filter(opt => opt.is_correct)
      .map(opt => opt.id)
      .sort();
    
    const selectedSorted = [...answer.selected_option_ids].sort();
    const isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(selectedSorted);
    
    if (isCorrect) correctCount++;
    
    return { ...answer, is_correct: isCorrect };
  });
  
  const score = (correctCount / assignment.questions.length) * 100;
  
  // Create submission
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .insert({
      assignment_id: assignmentId,
      user_id: userId,
      score,
      total_questions: assignment.questions.length,
    })
    .select()
    .maybeSingle();
  
  if (submissionError) throw submissionError;
  
  // Insert answers
  const { error: answersError } = await supabase
    .from('submission_answers')
    .insert(
      answersWithCorrectness.map(answer => ({
        submission_id: submission.id,
        question_id: answer.question_id,
        selected_option_ids: answer.selected_option_ids,
        is_correct: answer.is_correct,
      }))
    );
  
  if (answersError) throw answersError;
  
  return { ...submission, score, total_questions: assignment.questions.length };
}

export async function getAssignmentSubmission(assignmentId: string, userId: string) {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as AssignmentSubmission | null;
}

// الحصول على جميع محاولات حل واجب معين
export async function getAssignmentSubmissions(assignmentId: string) {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(name, email)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ==================== Lesson Progress APIs ====================
// تسجيل إكمال درس
export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// التحقق من إكمال درس
export async function checkLessonCompletion(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('is_completed', true)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

// الحصول على تقدم الطالب في كورس
export async function getCourseProgress(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*, lessons!inner(course_id)')
    .eq('user_id', userId)
    .eq('lessons.course_id', courseId)
    .eq('is_completed', true);

  if (error) throw error;
  return data || [];
}

// الحصول على تقدم جميع الطلاب في درس معين (للمدراء)
// Get all students' progress for a specific lesson (for admins)
export async function getLessonProgressForAdmin(lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      profiles!lesson_progress_user_id_fkey(id, full_name, email)
    `)
    .eq('lesson_id', lessonId)
    .order('completed_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

// الحصول على تقدم جميع الطلاب في كورس معين (للمدراء)
// Get all students' progress for a specific course (for admins)
export async function getCourseProgressForAdmin(courseId: string) {
  // First, get all students enrolled in the course
  const { data: enrolledStudents, error: enrollError } = await supabase
    .from('user_courses')
    .select('user_id, profiles!user_courses_user_id_fkey(id, name, email)')
    .eq('course_id', courseId);

  if (enrollError) throw enrollError;

  // Then get all progress records for this course
  const { data: progressData, error: progressError } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons!lesson_progress_lesson_id_fkey(id, title_ar, title_en, course_id)
    `)
    .eq('lessons.course_id', courseId);

  if (progressError) throw progressError;

  // Combine the data
  return {
    students: enrolledStudents?.map((item: any) => ({
      id: item.profiles.id,
      name: item.profiles.name,
      email: item.profiles.email,
    })) || [],
    progress: progressData || [],
  };
}

// ==================== Settings APIs ====================
export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data as Setting | null;
}

export async function updateSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key, value })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Setting;
}

// ==================== Device Login Tracking ====================
export async function recordDeviceLoginAttempt(
  userId: string,
  oldFingerprint: string | null,
  newFingerprint: string,
  oldIp: string | null,
  newIp: string
) {
  const { data, error } = await supabase
    .from('device_login_attempts')
    .insert({
      user_id: userId,
      old_browser_fingerprint: oldFingerprint,
      new_browser_fingerprint: newFingerprint,
      old_ip_address: oldIp,
      new_ip_address: newIp,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as DeviceLoginAttempt;
}

export async function getDeviceLoginAttempts(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('device_login_attempts')
    .select('*, profiles(name, email)')
    .order('attempted_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ==================== Certificate APIs ====================
export async function createCertificate(certificate: {
  course_id: string;
  student_id: string;
  student_full_name: string;
  description_ar?: string;
  description_en?: string;
  logo_url?: string;
  instructor_signature_text: string;
}) {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Certificate;
}

export async function getCertificatesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles!certificates_student_id_fkey(id, name, email),
      courses!certificates_course_id_fkey(id, title_ar, title_en)
    `)
    .eq('course_id', courseId)
    .order('issued_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getCertificatesByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses!certificates_course_id_fkey(id, title_ar, title_en, thumbnail_url)
    `)
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getCertificate(certificateId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles!certificates_student_id_fkey(id, name, email),
      courses!certificates_course_id_fkey(id, title_ar, title_en, thumbnail_url)
    `)
    .eq('id', certificateId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Certificate | null;
}

export async function updateCertificate(
  certificateId: string,
  updates: {
    student_full_name?: string;
    description_ar?: string;
    description_en?: string;
    logo_url?: string;
    instructor_signature_text?: string;
  }
) {
  const { data, error } = await supabase
    .from('certificates')
    .update(updates)
    .eq('id', certificateId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Certificate;
}

export async function deleteCertificate(certificateId: string) {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId);
  
  if (error) throw error;
}

export async function getAllCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles!certificates_student_id_fkey(id, name, email),
      courses!certificates_course_id_fkey(id, title_ar, title_en)
    `)
    .order('issued_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// دالة التحقق من الشهادة / Certificate verification function
export async function verifyCertificate(certificateId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      id,
      student_full_name,
      description_ar,
      description_en,
      issued_at,
      instructor_signature_text,
      profiles!certificates_student_id_fkey(id, name, email),
      courses!certificates_course_id_fkey(id, title_ar, title_en, instructor_name_ar, instructor_name_en)
    `)
    .eq('id', certificateId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

