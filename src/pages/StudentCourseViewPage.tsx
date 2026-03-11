import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getCourseWithLessons, 
  getLessonAttachments, 
  markLessonComplete, 
  checkLessonCompletion, 
  getCourseProgress,
  getAssignmentsByLesson,
  getAssignmentWithQuestions,
  submitAssignment,
  getAssignmentSubmission
} from '@/db/api';
import type { CourseWithLessons, Lesson, LessonAttachment, AssignmentWithQuestions } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, FileText, CheckCircle, Download, ClipboardList, BookOpen, Lock, Award, Clock } from 'lucide-react';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';

export default function StudentCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, string[]>>({});
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  // Assignment state
  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string[]>>({});
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      loadCourse();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (selectedLesson && user) {
      loadAttachments();
      checkCompletion();
      loadAssignment();
    }
  }, [selectedLesson, user]);

  const loadCourse = async () => {
    if (!courseId || !user) return;
    try {
      const data = await getCourseWithLessons(courseId);
      if (data) {
        setCourse(data);
        
        // تحميل جميع الدروس المكتملة للكورس
        // Load all completed lessons for the course
        const progress = await getCourseProgress(user.id, courseId);
        const completedIds = new Set<string>(progress.map((p: any) => p.lesson_id));
        setCompletedLessons(completedIds);
        
        // اختيار أول درس غير مكتمل أو الدرس الأول
        // Select first incomplete lesson or first lesson
        if (data.lessons && data.lessons.length > 0) {
          const firstIncomplete = data.lessons.find(l => !completedIds.has(l.id));
          setSelectedLesson(firstIncomplete || data.lessons[0]);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async () => {
    if (!selectedLesson) return;
    try {
      const data = await getLessonAttachments(selectedLesson.id);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const checkCompletion = async () => {
    if (!selectedLesson || !user) return;
    try {
      const completed = await checkLessonCompletion(user.id, selectedLesson.id);
      setIsLessonCompleted(completed);
      if (completed) {
        setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedLesson || !user) return;
    setMarkingComplete(true);
    try {
      await markLessonComplete(user.id, selectedLesson.id);
      setIsLessonCompleted(true);
      setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
      toast({
        title: t('تم الإكمال', 'Completed'),
        description: t('تم تسجيل إكمال الدرس بنجاح', 'Lesson marked as completed successfully'),
      });
      
      // الانتقال تلقائياً للدرس التالي إن وجد
      // Automatically move to next lesson if available
      if (course?.lessons) {
        const currentIndex = course.lessons.findIndex(l => l.id === selectedLesson.id);
        if (currentIndex >= 0 && currentIndex < course.lessons.length - 1) {
          const nextLesson = course.lessons[currentIndex + 1];
          setTimeout(() => {
            setSelectedLesson(nextLesson);
            setIsLessonCompleted(false);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تسجيل إكمال الدرس', 'Failed to mark lesson as complete'),
        variant: 'destructive',
      });
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleStartExam = () => {
    setExamDialogOpen(true);
    setExamStartTime(new Date());
    setExamAnswers({});
  };

  const handleExamAnswerChange = (questionId: string, optionIndex: number, isMultiple: boolean) => {
    setExamAnswers(prev => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        // اختيارات متعددة - إضافة أو إزالة
        // Multiple choice - add or remove
        const optionStr = String(optionIndex);
        if (current.includes(optionStr)) {
          return { ...prev, [questionId]: current.filter(i => i !== optionStr) };
        } else {
          return { ...prev, [questionId]: [...current, optionStr] };
        }
      } else {
        // اختيار واحد - استبدال
        // Single choice - replace
        return { ...prev, [questionId]: [String(optionIndex)] };
      }
    });
  };

  const handleSubmitExam = async () => {
    if (!selectedLesson || !user || !selectedLesson.exam_questions) return;

    // التحقق من الإجابة على جميع الأسئلة
    // Check if all questions are answered
    const unansweredQuestions = selectedLesson.exam_questions.filter(
      (q, index) => !examAnswers[String(index)] || examAnswers[String(index)].length === 0
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: t('تنبيه', 'Warning'),
        description: t('يجب الإجابة على جميع الأسئلة', 'Please answer all questions'),
        variant: 'destructive',
      });
      return;
    }

    setExamSubmitting(true);
    try {
      // حساب النتيجة
      // Calculate score
      let correctAnswers = 0;
      selectedLesson.exam_questions.forEach((question, qIndex) => {
        const studentAnswers = examAnswers[String(qIndex)]?.map(a => parseInt(a)) || [];
        const correctOptions = question.options
          .map((opt, idx) => opt.is_correct ? idx : -1)
          .filter(idx => idx !== -1);

        // التحقق من تطابق الإجابات
        // Check if answers match
        const isCorrect = 
          studentAnswers.length === correctOptions.length &&
          studentAnswers.every(a => correctOptions.includes(a)) &&
          correctOptions.every(c => studentAnswers.includes(c));

        if (isCorrect) correctAnswers++;
      });

      const score = Math.round((correctAnswers / selectedLesson.exam_questions.length) * 100);
      const passed = score >= (selectedLesson.passing_score || 70);

      if (passed) {
        // تسجيل إكمال الامتحان
        // Mark exam as completed
        await markLessonComplete(user.id, selectedLesson.id);
        setIsLessonCompleted(true);
        setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));

        toast({
          title: t('نجحت!', 'Passed!'),
          description: t(`لقد حصلت على ${score}% في الامتحان`, `You scored ${score}% on the exam`),
        });
      } else {
        toast({
          title: t('لم تنجح', 'Not Passed'),
          description: t(`لقد حصلت على ${score}%. الحد الأدنى للنجاح ${selectedLesson.passing_score}%`, 
            `You scored ${score}%. Minimum passing score is ${selectedLesson.passing_score}%`),
          variant: 'destructive',
        });
      }

      setExamDialogOpen(false);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تسليم الامتحان', 'Failed to submit exam'),
        variant: 'destructive',
      });
    } finally {
      setExamSubmitting(false);
    }
  };

  // ==================== Assignment Functions ====================
  const loadAssignment = async () => {
    if (!selectedLesson || !user) return;
    setLoadingAssignment(true);
    try {
      // Get assignments for this lesson
      const assignments = await getAssignmentsByLesson(selectedLesson.id);
      if (assignments && assignments.length > 0) {
        // Load first assignment with questions
        const assignmentData = await getAssignmentWithQuestions(assignments[0].id);
        setAssignment(assignmentData);
        
        // Check if student has already submitted
        const submission = await getAssignmentSubmission(assignments[0].id, user.id);
        setAssignmentSubmission(submission);
      } else {
        setAssignment(null);
        setAssignmentSubmission(null);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoadingAssignment(false);
    }
  };

  const handleStartAssignment = () => {
    setAssignmentAnswers({});
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    if (isMultiple) {
      // Multiple choice - toggle option
      setAssignmentAnswers(prev => {
        const current = prev[questionId] || [];
        const newAnswers = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: newAnswers };
      });
    } else {
      // Single choice - replace option
      setAssignmentAnswers(prev => ({
        ...prev,
        [questionId]: [optionId]
      }));
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignment || !user) return;

    // Check if all questions are answered
    const unansweredQuestions = assignment.questions.filter(
      q => !assignmentAnswers[q.id] || assignmentAnswers[q.id].length === 0
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: t('تنبيه', 'Warning'),
        description: t('يجب الإجابة على جميع الأسئلة', 'Please answer all questions'),
        variant: 'destructive',
      });
      return;
    }

    setAssignmentSubmitting(true);
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(assignmentAnswers).map(([questionId, optionIds]) => ({
        question_id: questionId,
        selected_option_ids: optionIds
      }));

      // Submit assignment
      const result = await submitAssignment(assignment.id, user.id, formattedAnswers);
      setAssignmentSubmission(result);

      toast({
        title: t('تم التسليم', 'Submitted'),
        description: t(
          `لقد حصلت على ${result.score.toFixed(0)}% (${Math.round((result.score / 100) * result.total_questions)} من ${result.total_questions})`,
          `You scored ${result.score.toFixed(0)}% (${Math.round((result.score / 100) * result.total_questions)} out of ${result.total_questions})`
        ),
      });

      setAssignmentDialogOpen(false);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تسليم الواجب', 'Failed to submit assignment'),
        variant: 'destructive',
      });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleSelectLesson = (lesson: Lesson, index: number) => {
    // التحقق من أن الدرس السابق مكتمل (إلا إذا كان الدرس الأول)
    // Check if previous lesson is completed (unless it's the first lesson)
    if (index > 0 && course?.lessons) {
      const previousLesson = course.lessons[index - 1];
      if (!completedLessons.has(previousLesson.id)) {
        toast({
          title: t('الدرس مقفل', 'Lesson Locked'),
          description: t(
            'يجب إكمال الدرس السابق أولاً',
            'You must complete the previous lesson first'
          ),
          variant: 'destructive',
        });
        return;
      }
    }

    setSelectedLesson(lesson);
    setIsLessonCompleted(completedLessons.has(lesson.id));
  };

  const isLessonLocked = (index: number): boolean => {
    // الدرس الأول دائماً مفتوح
    // First lesson is always unlocked
    if (index === 0) return false;
    
    // التحقق من إكمال الدرس السابق
    // Check if previous lesson is completed
    if (course?.lessons) {
      const previousLesson = course.lessons[index - 1];
      return !completedLessons.has(previousLesson.id);
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-[600px] w-full bg-muted" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[400px] w-full bg-muted mb-4" />
            <Skeleton className="h-[200px] w-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t('الكورس غير موجود', 'Course not found')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-6">
        {/* Course Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/my-courses')} className="mb-4">
            ← {t('العودة إلى كورساتي', 'Back to My Courses')}
          </Button>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? course.title_ar : course.title_en}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lessons Sidebar - Right side in RTL, Left in LTR */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('قائمة الدروس', 'Lessons')}</CardTitle>
                <CardDescription>
                  {course.lessons?.length || 0} {t('درس', 'lessons')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1 p-4">
                    {course.lessons && course.lessons.length > 0 ? (
                      course.lessons.map((lesson, index) => {
                        const locked = isLessonLocked(index);
                        const completed = completedLessons.has(lesson.id);
                        const isSelected = selectedLesson?.id === lesson.id;
                        const isExam = lesson.lesson_type === 'exam';
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson, index)}
                            disabled={locked}
                            className={`w-full text-right p-3 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : locked
                                ? 'opacity-50 cursor-not-allowed bg-muted'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {locked ? (
                                  <Lock className="h-5 w-5 text-muted-foreground" />
                                ) : completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : isExam ? (
                                  <Award className="h-5 w-5 text-amber-500" />
                                ) : isSelected ? (
                                  <PlayCircle className="h-5 w-5" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-right">
                                <p className="font-medium text-sm">
                                  {language === 'ar' ? lesson.title_ar : lesson.title_en}
                                </p>
                                {isExam && !completed && (
                                  <p className="text-xs text-amber-500 mt-1">
                                    {t('امتحان شامل', 'Comprehensive Exam')}
                                  </p>
                                )}
                                {completed && (
                                  <p className="text-xs text-green-500 mt-1">
                                    {t('مكتمل', 'Completed')}
                                  </p>
                                )}
                                {locked && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {t('مقفل', 'Locked')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t('لا توجد دروس', 'No lessons available')}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Left side in RTL, Right in LTR */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {selectedLesson ? (
              <>
                {/* Video Player or Exam Interface */}
                {selectedLesson.lesson_type === 'exam' ? (
                  // Exam Interface
                  <Card className="border-amber-500/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-6 w-6 text-amber-500" />
                        {language === 'ar' ? selectedLesson.title_ar : selectedLesson.title_en}
                      </CardTitle>
                      <CardDescription>
                        {t('امتحان شامل', 'Comprehensive Exam')}
                        {selectedLesson.exam_duration && (
                          <span className="mr-2">
                            • {selectedLesson.exam_duration} {t('دقيقة', 'minutes')}
                          </span>
                        )}
                        {selectedLesson.passing_score && (
                          <span>
                            • {t('درجة النجاح:', 'Passing Score:')} {selectedLesson.passing_score}%
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!isLessonCompleted ? (
                        <div className="text-center py-12">
                          <Award className="h-20 w-20 mx-auto mb-4 text-amber-500 opacity-50" />
                          <h3 className="text-xl font-semibold mb-2">
                            {t('الامتحان الشامل', 'Comprehensive Exam')}
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            {t(
                              'اختبر معرفتك بجميع محتويات الكورس',
                              'Test your knowledge of all course content'
                            )}
                          </p>
                          <Button size="lg" className="gap-2" onClick={handleStartExam}>
                            <ClipboardList className="h-5 w-5" />
                            {t('بدء الامتحان', 'Start Exam')}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-500" />
                          <h3 className="text-xl font-semibold mb-2 text-green-600">
                            {t('تم إكمال الامتحان', 'Exam Completed')}
                          </h3>
                          <p className="text-muted-foreground">
                            {t('لقد أكملت هذا الامتحان بنجاح', 'You have successfully completed this exam')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // Video Player
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {language === 'ar' ? selectedLesson.title_ar : selectedLesson.title_en}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedLesson.google_drive_video_id ? (
                        <>
                          <SecureVideoPlayer 
                            videoId={selectedLesson.google_drive_video_id}
                            watermarkText={`Luvia - ${user?.email || ''}`}
                            onSecurityViolation={() => {
                              toast({
                                title: t('تحذير أمني', 'Security Warning'),
                                description: t(
                                  'تم اكتشاف محاولة انتهاك. قد يتم إيقاف حسابك.',
                                  'Violation attempt detected. Your account may be suspended.'
                                ),
                                variant: 'destructive',
                              });
                            }}
                          />
                          {!isLessonCompleted && (
                            <div className="flex justify-center">
                              <Button
                                onClick={handleMarkComplete}
                                disabled={markingComplete}
                                size="lg"
                                className="gap-2"
                              >
                                <CheckCircle className="h-5 w-5" />
                                {markingComplete
                                  ? t('جاري الحفظ...', 'Saving...')
                                  : t('تم إكمال الدرس', 'Mark as Complete')}
                              </Button>
                            </div>
                          )}
                          {isLessonCompleted && (
                            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                              <CheckCircle className="h-5 w-5" />
                              {t('تم إكمال هذا الدرس', 'This lesson is completed')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {t('الفيديو غير متوفر', 'Video not available')}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Attachments - Only for video lessons */}
                {selectedLesson.lesson_type === 'video' && attachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t('مرفقات الدرس', 'Lesson Attachments')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attachments.map((attachment) => (
                          <Button
                            key={attachment.id}
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => window.open(attachment.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                            {language === 'ar' ? attachment.name_ar : attachment.name_en}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assignment Section - Only for video lessons */}
                {selectedLesson.lesson_type === 'video' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {isLessonCompleted ? (
                          <ClipboardList className="h-5 w-5" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                        {t('الواجب', 'Assignment')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLessonCompleted ? (
                        loadingAssignment ? (
                          <div className="text-center py-8">
                            <Skeleton className="h-16 w-16 mx-auto mb-4" />
                            <Skeleton className="h-4 w-48 mx-auto" />
                          </div>
                        ) : assignment ? (
                          <div className="text-center py-8">
                            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-primary" />
                            <h3 className="font-semibold mb-2">
                              {language === 'ar' ? assignment.title_ar : assignment.title_en}
                            </h3>
                            {assignment.description_ar || assignment.description_en ? (
                              <p className="text-sm text-muted-foreground mb-4">
                                {language === 'ar' ? assignment.description_ar : assignment.description_en}
                              </p>
                            ) : null}
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{assignment.questions.length} {t('أسئلة', 'questions')}</span>
                            </div>
                            {assignmentSubmission ? (
                              <div className="space-y-3">
                                <Badge variant="default" className="text-base px-4 py-2">
                                  {t('تم التسليم', 'Submitted')} - {assignmentSubmission.score.toFixed(0)}%
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {t(
                                    `${Math.round((assignmentSubmission.score / 100) * assignmentSubmission.total_questions)} من ${assignmentSubmission.total_questions} إجابات صحيحة`,
                                    `${Math.round((assignmentSubmission.score / 100) * assignmentSubmission.total_questions)} out of ${assignmentSubmission.total_questions} correct`
                                  )}
                                </p>
                              </div>
                            ) : (
                              <Button onClick={handleStartAssignment}>
                                {t('حل الواجب', 'Solve Assignment')}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground mb-4">
                              {t('لا يوجد واجب لهذا الدرس', 'No assignment for this lesson')}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8">
                          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-2 font-medium">
                            {t('الواجب مقفل', 'Assignment Locked')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              'يجب إكمال مشاهدة الدرس أولاً للوصول إلى الواجب',
                              'You must complete the lesson first to access the assignment'
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <PlayCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {t('اختر درساً من القائمة', 'Select a lesson from the list')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              {selectedLesson && (language === 'ar' ? selectedLesson.title_ar : selectedLesson.title_en)}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              {selectedLesson?.exam_duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedLesson.exam_duration} {t('دقيقة', 'minutes')}
                </span>
              )}
              {selectedLesson?.passing_score && (
                <span>
                  {t('درجة النجاح:', 'Passing Score:')} {selectedLesson.passing_score}%
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedLesson?.exam_questions?.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('سؤال', 'Question')} {qIndex + 1}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? question.question_text_ar : question.question_text_en}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {question.question_type === 'single_choice' ? (
                    <RadioGroup
                      value={examAnswers[String(qIndex)]?.[0] || ''}
                      onValueChange={(value) => handleExamAnswerChange(String(qIndex), parseInt(value), false)}
                    >
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2 space-x-reverse py-2">
                          <RadioGroupItem value={String(oIndex)} id={`q${qIndex}-o${oIndex}`} />
                          <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer flex-1">
                            {language === 'ar' ? option.text_ar : option.text_en}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2 space-x-reverse py-2">
                          <Checkbox
                            id={`q${qIndex}-o${oIndex}`}
                            checked={examAnswers[String(qIndex)]?.includes(String(oIndex)) || false}
                            onCheckedChange={() => handleExamAnswerChange(String(qIndex), oIndex, true)}
                          />
                          <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer flex-1">
                            {language === 'ar' ? option.text_ar : option.text_en}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setExamDialogOpen(false)} disabled={examSubmitting}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleSubmitExam} disabled={examSubmitting}>
              {examSubmitting ? t('جاري التسليم...', 'Submitting...') : t('تسليم الامتحان', 'Submit Exam')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              {assignment && (language === 'ar' ? assignment.title_ar : assignment.title_en)}
            </DialogTitle>
            {assignment?.description_ar || assignment?.description_en ? (
              <DialogDescription>
                {language === 'ar' ? assignment.description_ar : assignment.description_en}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          <div className="space-y-6 py-4">
            {assignment?.questions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('سؤال', 'Question')} {qIndex + 1}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? question.question_text_ar : question.question_text_en}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {question.question_type === 'single_choice' ? (
                    <RadioGroup
                      value={assignmentAnswers[question.id]?.[0] || ''}
                      onValueChange={(value) => handleAssignmentAnswerChange(question.id, value, false)}
                    >
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse py-2">
                          <RadioGroupItem value={option.id} id={`aq-${option.id}`} />
                          <Label htmlFor={`aq-${option.id}`} className="cursor-pointer flex-1">
                            {language === 'ar' ? option.text_ar : option.text_en}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse py-2">
                          <Checkbox
                            id={`aq-${option.id}`}
                            checked={assignmentAnswers[question.id]?.includes(option.id) || false}
                            onCheckedChange={() => handleAssignmentAnswerChange(question.id, option.id, true)}
                          />
                          <Label htmlFor={`aq-${option.id}`} className="cursor-pointer flex-1">
                            {language === 'ar' ? option.text_ar : option.text_en}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)} disabled={assignmentSubmitting}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleSubmitAssignment} disabled={assignmentSubmitting}>
              {assignmentSubmitting ? t('جاري التسليم...', 'Submitting...') : t('تسليم الواجب', 'Submit Assignment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
