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
  AssignmentSubmission,
  Certificate,
  Setting,
  CourseWithLessons,
  AssignmentWithQuestions,
  DeviceLoginAttempt,
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
    .select('*, lesson_attachments(*)')
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

// ==================== Lesson & Attachment APIs ====================
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
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .eq('is_used', false)
    .maybeSingle();
  
  if (voucherError) throw voucherError;
  if (!voucher) throw new Error('كود غير صالح أو مستخدم بالفعل');
  
  if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
    throw new Error('انتهت صلاحية الكود');
  }
  
  const { data: existingCourse } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', voucher.course_id)
    .maybeSingle();
  
  if (existingCourse) {
    throw new Error('أنت تمتلك هذا الكورس بالفعل');
  }
  
  const { error: updateError } = await supabase
    .from('vouchers')
    .update({
      is_used: true,
      used_by_user_id: userId,
      used_at: new Date().toISOString(),
    })
    .eq('code', code);
  
  if (updateError) throw updateError;
  
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

export async function createAssignment(assignment: any) {
  const { questions, ...assignmentData } = assignment;
  
  const { data: assignmentRecord, error: assignmentError } = await supabase
    .from('assignments')
    .insert(assignmentData)
    .select()
    .maybeSingle();
  
  if (assignmentError) throw assignmentError;

  if (questions && questions.length > 0) {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
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
      
      if (questionError) throw questionError;

      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        const isCorrect = question.correct_answers.includes(j);
        
        const { error: optionError } = await supabase
          .from('assignment_question_options')
          .insert({
            question_id: questionRecord.id,
            text_ar: option.text_ar,
            text_en: option.text_en,
            is_correct: isCorrect,
            order_index: j,
          });
        
        if (optionError) throw optionError;
      }
    }
  }
  return assignmentRecord as Assignment;
}

export async function submitAssignment(
  assignmentId: string,
  userId: string,
  answers: { question_id: string; selected_option_ids: string[] }[]
) {
  const assignment = await getAssignmentWithQuestions(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  
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

// ==================== Certificate & Gamification APIs ====================
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

export async function getPointsHistory(userId: string) {
  const { data, error } = await supabase
    .from('points_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function transferPointsByCode(senderId: string, receiverCode: string, amount: number) {
  console.log("--- بداية العملية ---");
  console.log("المرسل:", senderId, "المستلم:", receiverCode, "المبلغ:", amount);

  if (amount <= 0) throw new Error('يجب أن يكون المبلغ أكبر من الصفر');

  // 1. البحث عن الطالب
  const { data: receiverProfile, error: receiverError } = await supabase
    .from('profiles')
    .select('id, points, user_code')
    .eq('user_code', receiverCode)
    .limit(1)
    .maybeSingle();

  if (receiverError) {
    console.error("خطأ في البحث عن المستلم:", receiverError);
    throw receiverError;
  }
  if (!receiverProfile) {
    console.error("لم يتم العثور على طالب بالكود:", receiverCode);
    throw new Error('لم يتم العثور على طالب بهذا الكود');
  }
  console.log("تم العثور على المستلم:", receiverProfile.id);

  // 2. التحقق من المرسل
  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('id, points, user_code')
    .eq('id', senderId)
    .single();

  if (senderError) {
    console.error("خطأ في جلب بيانات المرسل:", senderError);
    throw senderError;
  }
  console.log("رصيد المرسل الحالي:", senderProfile.points);

  if (senderProfile.points < amount) {
    console.error("الرصيد غير كافٍ");
    throw new Error('رصيدك غير كافٍ');
  }

  // 3. تحديث الرصيد (الخصم)
  console.log("جاري خصم النقاط...");
  const { error: deductError } = await supabase
    .from('profiles')
    .update({ points: senderProfile.points - amount })
    .eq('id', senderId);

  if (deductError) {
    console.error("خطأ أثناء الخصم:", deductError);
    throw deductError;
  }
  console.log("تم خصم النقاط بنجاح");

  // 4. إضافة النقاط للمستلم
  console.log("جاري إضافة النقاط للمستلم...");
  const { error: addError } = await supabase
    .from('profiles')
    .update({ points: (receiverProfile.points || 0) + amount })
    .eq('id', receiverProfile.id);

  if (addError) {
    console.error("خطأ أثناء الإضافة للمستلم:", addError);
    throw addError;
  }
  console.log("تم إضافة النقاط بنجاح");

  // 5. تسجيل العملية
  console.log("جاري تسجيل العملية...");
  const { error: logError } = await supabase.from('points_history').insert({
    sender_id: senderId,
    receiver_id: receiverProfile.id,
    amount: amount,
    activated_at: new Date().toISOString(),
    user_id: senderId,
    transaction_type: 'p2p_transfer'
  });

  if (logError) {
    console.error("خطأ أثناء التسجيل:", logError);
    throw logError;
  }
  
  console.log("--- تم التحويل بنجاح تام! ---");
  return { success: true };
}
// ==================== Daily Spin & Leaderboard APIs ====================
export type SpinResult = {
  success: boolean;
  rewardPoints: number;
  message: string;
  canSpinAgainAt?: string | null;
};

export async function executeDailySpin(userId: string): Promise<SpinResult> {
  // 1. جلب بيانات الطالب بالعمود الصحيح لـ الـ spin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, points, last_spin_at') // 👈 تم التعديل إلى last_spin_at حسب جدولك
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('لم يتم العثور على الحساب');

  const now = new Date();
  const lastSpin = profile.last_spin_at ? new Date(profile.last_spin_at) : null;

  // 2. التحقق من مرور 24 ساعة (أو نفس اليوم)
  if (lastSpin) {
    const sameDay =
      lastSpin.getFullYear() === now.getFullYear() &&
      lastSpin.getMonth() === now.getMonth() &&
      lastSpin.getDate() === now.getDate();

    if (sameDay) {
      const nextSpin = new Date(lastSpin);
      nextSpin.setDate(nextSpin.getDate() + 1);
      nextSpin.setHours(0, 0, 0, 0);

      return {
        success: false,
        rewardPoints: 0,
        message: 'لقد استلمت المكافأة اليومية بالفعل',
        canSpinAgainAt: nextSpin.toISOString(),
      };
    }
  }

  // مصفوفة الجوائز المتوافقة مع الـ UI
  const rewards = [5, 10, 15, 20, 50]; 
  const rewardPoints = rewards[Math.floor(Math.random() * rewards.length)];

  const currentPoints = profile.points || 0;

  // 3. تحديث النقاط ووقت اللفة بالأعمدة الحقيقية المتاحة في جدولك فقط
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      points: currentPoints + rewardPoints,
      last_spin_at: now.toISOString(), // 👈 التعديل هنا لـ العمود الحقيقي
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  // 4. تسجيل العملية في جدول الـ history المتوافق مع السيستم
  await supabase.from('points_history').insert({
    user_id: userId,
    amount: rewardPoints,
    activated_at: now.toISOString(),
    transaction_type: 'daily_spin'
  });

  return {
    success: true,
    rewardPoints,
    message: `مبروك! ربحت ${rewardPoints} نقطة 🪙`,
  };
}

export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, points, avatar_url, created_at')
    .order('points', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((profile: any, index: number) => ({
    ...profile,
    rank: index + 1,
  }));
}

export async function getCertificatesByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses!certificates_course_id_fkey(
        id,
        title_ar,
        title_en
      )
    `)
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("key", key)
    .single();

  if (error) throw error;
  return data;
}
export async function deleteAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;

  return true;
}
export async function updateAssignment(
  assignmentId: string,
  updates: Record<string, any>
) {
  const { data, error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
// ==================== Certificates APIs ====================

export async function getAllCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCertificate(certificate: any) {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCertificate(
  certificateId: string,
  updates: any
) {
  const { data, error } = await supabase
    .from('certificates')
    .update(updates)
    .eq('id', certificateId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCertificate(certificateId: string) {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId);

  if (error) throw error;
}

// ==================== Admin Progress APIs ====================

export async function getCourseProgressForAdmin(courseId?: string) {
  let query = supabase
    .from('lesson_progress')
    .select(`
      *,
      profiles(*),
      lessons(*)
    `);

  if (courseId) {
    query = query.eq('lessons.course_id', courseId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
export async function updateUserStarsOrPoints(userId: string, points: number) {
  // 1. جلب رصيد نقاط الطالب الحالي أولاً
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentPoints = profile?.points || 0;

  // 2. تحديث الرصيد وإضافة الـ 5 نقاط الجديدة
  const { data, error } = await supabase
    .from('profiles')
    .update({ points: currentPoints + points })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // 3. إضافة سجل في جدول الـ history لتوثيق المكافأة
  await supabase.from('points_history').insert({
    user_id: userId,
    points_change: points,
    reason: 'Lesson Completion Reward',
    created_at: new Date().toISOString(),
  });

  return data;
}