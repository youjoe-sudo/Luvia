import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getCourseWithLessons,
  markLessonComplete,
  checkLessonCompletion,
  getCourseProgress,
  getAssignmentsByLesson,
  getAssignmentWithQuestions,
  submitAssignment,
  getAssignmentSubmission,
  updateUserStarsOrPoints,
  getProfile // استيراد دالة جلب البروفايل للتأكد من النقاط الحالية
} from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { AssignmentWithQuestions, CourseWithLessons, Lesson } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileQuestion,
  MonitorPlay,
  ShieldCheck,
  Trophy,
  X,
  BookOpen,
  Lock,
  Star,
  Coins
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import SecureVideoPlayer from '@/components/SecureVideoPlayer'; 

export default function StudentCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  
  // شاشات الحماية المضافة لنظام النقاط
  const [userPoints, setUserPoints] = useState<number>(0);
  const [checkingPoints, setCheckingPoints] = useState(true);

  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string[]>>({});
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

  // دالة جلب رصيد نقاط الطالب الحالية من السيرفر مباشرة لحماية آمنة
  const fetchCurrentPoints = useCallback(async () => {
    if (!user) return;
    try {
      setCheckingPoints(true);
      const profileData = await getProfile(user.id);
      setUserPoints((profileData as any)?.points || 0);
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setCheckingPoints(false);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!courseId || !user) return;
    try {
      setLoading(true);
      await fetchCurrentPoints(); // جلب النقاط أولاً وقبل كل شيء

      const data = await getCourseWithLessons(courseId);
      if (data) {
        setCourse(data);
        const progress = await getCourseProgress(user.id, courseId);
        const completedIds = new Set<string>(progress.map((p: any) => p.lesson_id));
        setCompletedLessons(completedIds);
        if (data.lessons?.length > 0) {
          const firstIncomplete = data.lessons.find(l => !completedIds.has(l.id));
          setSelectedLesson(firstIncomplete || data.lessons[0]);
        }
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }, [courseId, user, fetchCurrentPoints]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadLessonExtras = useCallback(async () => {
    if (!selectedLesson || !user) return;
    try {
      const [comp, assign] = await Promise.all([
        checkLessonCompletion(user.id, selectedLesson.id),
        getAssignmentsByLesson(selectedLesson.id)
      ]);
      setIsLessonCompleted(comp);
      
      if (assign?.length > 0) {
        const fullAssign = await getAssignmentWithQuestions(assign[0].id);
        const sub = await getAssignmentSubmission(assign[0].id, user.id);
        setAssignment(fullAssign);
        setAssignmentSubmission(sub);
      } else {
        setAssignment(null);
        setAssignmentSubmission(null);
      }
    } catch (error) {
      console.error(error);
    }
  }, [selectedLesson, user]);

  useEffect(() => { loadLessonExtras(); }, [loadLessonExtras]);

  const handleAnswer = (qId: string, optId: string, isMulti: boolean) => {
    setAssignmentAnswers(prev => {
      const current = prev[qId] || [];
      if (isMulti) {
        return { ...prev, [qId]: current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId] };
      }
      return { ...prev, [qId]: [optId] };
    });
  };

  // حماية وتأكيد إنهاء المحاضرة
  const handleLessonCompletion = async () => {
    if (!selectedLesson || !user) return;
    
    // 🛡️ الحماية الصارمة من جهة الـ API لمنع الاستدعاء اليدوي بالـ Console
    if (userPoints < 10) {
      toast({ 
        title: t('عذراً، محاولة غير مصرح بها ❌', 'Unauthorized Attempt ❌'), 
        description: t('رصيدك غير كافٍ لإتمام المحاضرة وحصد النقاط.', 'Incompatible points balance.'),
        variant: "destructive"
      });
      return;
    }

    setMarkingComplete(true);
    try {
      await markLessonComplete(user.id, selectedLesson.id);
      await updateUserStarsOrPoints(user.id, 5);
      
      setIsLessonCompleted(true);
      setCompletedLessons(prev => new Set(prev).add(selectedLesson.id));
      
      // تحديث قيمة النقاط محلياً بعد الإضافة الناجحة للـ 5 نقاط
      setUserPoints(prev => prev + 5);
      
      toast({ 
        title: t('عاش يا بطل! 🌟', 'Excellent Job! 🌟'), 
        description: t('تم إنهاء المحاضرة بنجاح وإضافة 5 نقاط لرصيدك! تم فك قفل الواجب الآن.', 'Lesson completed! 5 points added & assignment unlocked.')
      });
    } catch (error) { 
      console.error(error);
      toast({ title: "حدث خطأ أثناء حفظ التقدم", variant: "destructive" }); 
    } finally { 
      setMarkingComplete(false); 
    }
  };

  const executeSubmission = async () => {
    if (!assignment || !user) return;
    setAssignmentSubmitting(true);
    try {
      const formatted = Object.entries(assignmentAnswers).map(([qId, opts]) => ({
        question_id: qId, selected_option_ids: opts
      }));
      const res = await submitAssignment(assignment.id, user.id, formatted);
      setAssignmentSubmission(res);
      setConfirmSubmitOpen(false);
      setAssignmentDialogOpen(false);
      setShowResult(true);
      
      toast({
        title: t('تم تسليم الواجب بنجاح! 📝', 'Assignment Submitted! 📝'),
        description: `${t('حصلت على تقييم:', 'Your Score:')} ${res.score}%`
      });
    } catch (err) { 
      toast({ title: "Error submitting assignment", variant: "destructive" }); 
    } finally { 
      setAssignmentSubmitting(false); 
    }
  };

  if (loading || checkingPoints) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Skeleton className="w-[80%] h-32 rounded-3xl opacity-20" /></div>;

  const currentPdfUrl = (selectedLesson as any)?.lesson_attachments?.[0]?.file_url;  
  
  // ⛔ متغيّر الحماية الأمني الحاسم لغلق الدرس
  const isLessonLockedByPoints = userPoints < 10;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-16 relative overflow-hidden font-sans antialiased">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 pt-10 max-w-7xl relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 text-right rtl:text-right">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {language === 'ar' ? course?.title_ar : course?.title_en}
            </h1>
            <p className="text-xs text-slate-500">{t('مسار المشاهدة والتقييم الأكاديمي الشامل', 'Comprehensive viewing and assessment panel')}</p>
          </div>
          
          {/* عرض رصيد النقاط الحالي للطالب أعلى الصفحة بدقة */}
          <div className="flex gap-2.5">
            <Badge className="bg-amber-950/40 text-amber-400 border border-amber-500/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {t('رصيدك الحالي:', 'Your Balance:')} {userPoints} {t('نقطة', 'Points')}
            </Badge>

            <Badge className="bg-blue-950/50 text-blue-400 border border-blue-500/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-md">
              {t('التقدم:', 'Progress:')} {Math.round((completedLessons.size / (course?.lessons?.length || 1)) * 100)}%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* الفهرس الجانبي */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-slate-900/20 border border-slate-800/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-950/60 bg-slate-950/20 text-right rtl:text-right">
                <span className="text-xs font-bold text-slate-400">{t('فهرس المحاضرات', 'Lessons Index')}</span>
              </div>
              <ScrollArea className="h-[40vh] lg:h-[65vh] p-3">
                {course?.lessons?.map((l, i) => (
                  <button
                    key={l.id}
                    disabled={isLessonLockedByPoints} // تعطيل التنقل إذا كان مقفول بالنقاط
                    onClick={() => setSelectedLesson(l)}
                    className={`w-full p-4 mb-2.5 rounded-xl text-right transition-all duration-300 flex flex-col gap-1.5 border relative overflow-hidden group ${
                      isLessonLockedByPoints ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      selectedLesson?.id === l.id 
                      ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-inner' 
                      : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full flex-row-reverse">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${selectedLesson?.id === l.id ? 'text-blue-400' : 'text-slate-600'}`}>
                          Lesson {i + 1}
                        </span>
                        {completedLessons.has(l.id) && <ShieldCheck className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />}
                    </div>
                    <span className="font-bold text-xs leading-snug mt-0.5 text-right rtl:text-right w-full flex items-center justify-between flex-row-reverse">
                      {language === 'ar' ? l.title_ar : l.title_en}
                      {isLessonLockedByPoints && <Lock className="w-3 h-3 text-red-400" />}
                    </span>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          </div>

          {/* منطقة تشغيل الفيديو والواجبات الملتزمة بالحماية */}
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {selectedLesson && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                
                {/* 🛡️ كارت جدار الحماية (UI Gate): يُعرض بدلاً من الفيديو إذا كان الرصيد أقل من 10 نقاط */}
                {isLessonLockedByPoints ? (
                  <Card className="relative w-full aspect-video border-2 border-dashed border-red-500/30 bg-gradient-to-b from-red-950/20 to-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-xl backdrop-blur-sm animate-fade-in">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 shadow-lg mb-4 animate-bounce">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-red-400 mb-2">
                      {t('المحاضرة مقفولة بـجدار حماية لوفيا 🔒', 'Lesson Locked by Security Gate 🔒')}
                    </h3>
                    <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-6">
                      {t(`عذراً يا بطل، نظام الأمان يتطلب وجود 10 نقاط على الأقل في حسابك لتتمكن من فتح الفيديو وتصفح المحتويات. رصيدك الحالي هو (${userPoints}) نقاط فقط.`, `Security check failure: minimum 10 points required. Your current balance is (${userPoints}) points.`)}
                    </p>
                    <div className="text-[11px] bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 rounded-xl flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {t('يمكنك شحن نقاطك عبر الأكواد أو من خلال عجلة الحظ اليومية 🎡', 'Spin the daily wheel or activate voucher codes.')}
                    </div>
                  </Card>
                ) : (
                  // تشغيل الفيديو بشكل طبيعي طالما الطالب يحمل 10 نقاط أو أكثر
                  <Card className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-6 relative w-full p-1">
                    {selectedLesson.google_drive_video_id ? (
                      <SecureVideoPlayer 
                        videoId={selectedLesson.google_drive_video_id}
                        studentName={user?.user_metadata?.full_name || user?.email || 'طالب لوفيا'}
                        studentPhone={user?.user_metadata?.phone || ''}
                      />
                    ) : (
                      <div className="relative w-full aspect-video flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 rounded-xl">
                        <MonitorPlay className="w-14 h-14 text-slate-800 mb-3" />
                        <h2 className="text-sm font-bold text-slate-500 px-4 text-center">
                          {t('عذراً، لا يوجد فيديو متاح لهذه المحاضرة حالياً', 'No video available for this lesson currently')}
                        </h2>
                      </div>
                    )}
                  </Card>
                )}

                {/* زر تأكيد المشاهدة والحصول على الـ 5 نقاط - لا يظهر أبداً إلا في حال تجاوز الحماية المبدئية */}
                {!isLessonLockedByPoints && (
                  <Button
                      disabled={isLessonCompleted || markingComplete}
                      onClick={handleLessonCompletion}
                      className={`w-full h-14 rounded-xl font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 mb-6 border cursor-pointer ${
                        isLessonCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent shadow-lg shadow-blue-600/10 active:scale-[0.99]'
                      }`}
                  >
                      {markingComplete ? (
                        <Clock className="animate-spin w-5 h-5" />
                      ) : isLessonCompleted ? (
                        <>
                          <ShieldCheck className="w-5 h-5" /> 
                          {t('تم إكمال المحاضرة وحصد 5 نقاط بنجاح 🌟', 'Completed +5 Points Awarded!')}
                        </>
                      ) : (
                        <>
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" /> 
                          {t('أنهيت المحاضرة؟ اضغط هنا للحصول على 5 نقاط وفتح الواجبات', 'Finish Lesson & Collect 5 Points')}
                        </>
                      )}
                  </Button>
                )}

                {/* قطاع الواجب والمصادر - يتأثر ديناميكياً بحالة القفل الإجباري */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* كارت الواجب التفاعلي */}
                  <Card className={`bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md shadow-sm transition-all duration-300 ${(!isLessonCompleted || isLessonLockedByPoints) ? 'opacity-50 select-none' : ''}`}>
                    <div className="flex items-center gap-4 text-right rtl:text-right flex-row-reverse">
                        <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-inner">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-xs">{t('واجب المحاضرة التفاعلي', 'Quiz')}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                {isLessonLockedByPoints
                                 ? t('🔒 المحاضرة مغلقة بالكامل', '🔒 Entire lesson locked')
                                 : !isLessonCompleted 
                                 ? t('🔒 شاهد أولاً لفتح الواجب', '🔒 Watch video first')
                                 : (!assignment || !assignment.questions || assignment.questions.length === 0)
                                 ? t('لا يوجد واجب حالياً', 'No quiz available')
                                 : `${assignment.questions.length} ${t('أسئلة معتمدة للحل', 'Questions')}`}
                            </p>
                        </div>
                    </div>
                    
                    {isLessonCompleted && !isLessonLockedByPoints ? (
                      (assignment && assignment.questions && assignment.questions.length > 0) ? (
                        assignmentSubmission ? (
                          <Button size="sm" onClick={() => setShowResult(true)} className="bg-slate-950/60 hover:bg-slate-950 text-slate-300 border border-slate-800 rounded-xl h-9 px-4 font-bold text-xs cursor-pointer">{t('النتيجة', 'Score')}</Button>
                        ) : (
                          <Button size="sm" onClick={() => { setCurrentQuestionIndex(0); setAssignmentAnswers({}); setAssignmentDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-9 px-4 font-bold text-xs shadow-md cursor-pointer">{t('ابدأ الآن', 'Start')}</Button>
                        )
                      ) : (
                        <Badge variant="outline" className="text-slate-600 border-slate-800 bg-slate-950/40 text-[10px] px-2.5 py-1 rounded-md">{t('غير متوفر', 'N/A')}</Badge>
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600 mr-2" />
                    )}
                  </Card>

                  {/* كارت الملحقات ومصادر الـ PDF */}
                  <Card className={`bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md shadow-sm transition-opacity ${(!currentPdfUrl || isLessonLockedByPoints) ? 'opacity-50 select-none' : ''}`}>
                    <div className="flex items-center gap-4 text-right rtl:text-right flex-row-reverse">
                        <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-xs">{t('الملخصات والمصادر المرفقة', 'Resources')}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                {isLessonLockedByPoints ? t('🔒 مغلق بالكامل', '🔒 Locked') : currentPdfUrl ? t('تصفح ملخص الـ PDF المعتمد', 'View Document') : t('لم يتم إرفاق ملفات', 'No files attached')}
                            </p>
                        </div>
                    </div>
                    {currentPdfUrl && !isLessonLockedByPoints ? (
                        <button 
                          onClick={() => setIsPdfViewerOpen(true)} 
                          className="w-8 h-8 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center hover:bg-slate-900 text-slate-300 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    ) : (
                        <div className="w-4 h-4 text-slate-700 mr-2" />
                    )}
                  </Card>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECURE PDF DIALOG VIEWER --- */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-5xl w-[94%] h-[85vh] bg-slate-950/95 backdrop-blur-2xl border border-slate-800 p-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex flex-row items-center justify-between z-20 relative text-right rtl:text-right">
            <div className="flex items-center gap-3 flex-row-reverse">
               <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <BookOpen className="w-4 h-4 text-blue-400" />
               </div>
               <DialogTitle className="text-sm font-bold text-slate-200">{t('عرض الملحق الدراسي الآمن', 'View Document')}</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
          
          <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-wrap items-center justify-center overflow-hidden opacity-[0.04]">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="transform -rotate-45 text-white text-xl font-black p-12 whitespace-nowrap text-center">
                  {user?.user_metadata?.full_name || user?.email} <br /> {user?.user_metadata?.phone || ''}
                </div>
              ))}
            </div>
            <iframe src={`${currentPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none relative z-10 opacity-95" title="Secure PDF Viewer" />
          </div>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGNMENT WORKSPACE DIALOG --- */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[100dvh] md:h-[80vh] bg-slate-950/95 backdrop-blur-2xl border-none md:border md:border-slate-800 p-0 flex flex-col overflow-hidden md:rounded-2xl shadow-2xl">
          <div className="p-5 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between text-right rtl:text-right">
            <DialogClose asChild>
              <Button variant="ghost" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>

            <div className="flex items-center gap-4 text-right rtl:text-right flex-row-reverse">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                <FileQuestion className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-sm md:text-base font-bold text-white">{language === 'ar' ? assignment?.title_ar : assignment?.title_en}</DialogTitle>
                <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-purple-500" animate={{ width: `${((currentQuestionIndex + 1) / (assignment?.questions?.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              {assignment?.questions?.[currentQuestionIndex] && (
                <motion.div key={currentQuestionIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto mt-2 text-right rtl:text-right">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-8 leading-relaxed">{language === 'ar' ? assignment.questions[currentQuestionIndex].question_text_ar : assignment.questions[currentQuestionIndex].question_text_en}</h2>
                    <div className="space-y-3.5">
                      {assignment.questions[currentQuestionIndex].options.map((opt) => {
                        const isSelected = assignmentAnswers[assignment.questions[currentQuestionIndex].id]?.includes(opt.id);
                        return (
                          <Label key={opt.id} className={`flex items-center gap-4 p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex-row-reverse ${isSelected ? 'bg-purple-500/5 border-purple-500/40 text-white shadow-inner' : 'bg-slate-900/20 border-slate-800 text-slate-300 hover:bg-slate-900/50 hover:border-slate-700'}`}>
                            <Checkbox checked={isSelected || false} onCheckedChange={() => handleAnswer(assignment.questions[currentQuestionIndex].id, opt.id, assignment.questions[currentQuestionIndex].question_type === 'multiple_choice')} className="sr-only" />
                            <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-700'}`}>{isSelected && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}</div>
                            <span className="text-sm font-medium flex-1 text-right rtl:text-right">{language === 'ar' ? opt.text_ar : opt.text_en}</span>
                          </Label>
                        );
                      })}
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-5 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0} className="text-slate-400 hover:text-white hover:bg-slate-900 h-11 px-5 rounded-xl text-xs font-bold border border-transparent disabled:opacity-35 cursor-pointer">
              <ChevronLeft className="w-4 h-4 ml-1.5" /> {t('السابق', 'Back')}
            </Button>
            {currentQuestionIndex === (assignment?.questions?.length || 0) - 1 ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-6 rounded-xl font-bold shadow-md text-xs transition-colors cursor-pointer">{t('تسليم الواجب الكلي', 'Submit Quiz')}</Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-white text-slate-950 hover:bg-slate-200 h-11 px-7 rounded-xl font-bold text-xs transition-colors cursor-pointer">{t('التالي', 'Next')}</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRMATION MODAL --- */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="bg-slate-950 border border-slate-800 rounded-2xl text-center p-8 max-w-sm shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-500/20 shadow-inner">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-lg font-bold text-white mb-1.5">{t('هل أنت متأكد من تسليم الإجابات؟', 'Are you sure?')}</DialogTitle>
          <p className="text-slate-500 text-xs mb-6">{t('تذكر أنه لن يكون بمقدورك مراجعة أو تعديل خياراتك بعد الاعتماد النهائي.', 'You cannot modify your choices after submission.')}</p>
          <div className="flex flex-col gap-2.5">
            <Button onClick={executeSubmission} disabled={assignmentSubmitting} className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer">
              {assignmentSubmitting ? <Clock className="animate-spin w-4 h-4" /> : t('تأكيد وإرسال الحل', 'Yes, Submit')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)} className="w-full h-11 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent text-xs font-bold cursor-pointer">{t('العودة للمراجعة', 'Review Answers')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- TROPHY SCORE BOARD RESULT --- */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center shadow-2xl">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 relative shadow-inner">
                <Trophy className="w-10 h-10 text-blue-400 relative z-10" />
              </div>
            </motion.div>
            <h2 className="text-sm font-bold text-slate-400">{t('النتيجة المستحقة للواجب', 'Your Score')}</h2>
            <div className="text-6xl font-black text-white my-5 tracking-tight font-mono">{assignmentSubmission?.score}%</div>
            <Button onClick={() => setShowResult(false)} className="w-full h-11 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-bold text-xs shadow-md mt-2 cursor-pointer">{t('إغلاق الواجهة', 'Close')}</Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}