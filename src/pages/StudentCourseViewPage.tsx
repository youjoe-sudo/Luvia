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
  getAssignmentSubmission
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
  CheckCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// 👇 استيراد مشغل الفيديو الآمن اللي صممناه
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

  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string[]>>({});
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  
  // 👇 حالة جديدة لفتح وإغلاق عارض الـ PDF
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!courseId || !user) return;
    try {
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
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [courseId, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadLessonExtras = useCallback(async () => {
    if (!selectedLesson || !user) return;
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
    } catch (err) { toast({ title: "Error", variant: "destructive" }); }
    finally { setAssignmentSubmitting(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Skeleton className="w-[80%] h-32 rounded-3xl opacity-20" /></div>;

const currentPdfUrl = (selectedLesson as any)?.lesson_attachments?.[0]?.file_url;  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      {/* تأثير إضاءة خلفي (Glow Effect) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="container py-6 md:py-10 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {language === 'ar' ? course?.title_ar : course?.title_en}
          </h1>
          <Badge className="bg-blue-900/40 text-blue-300 border border-blue-500/30 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            {t('التقدم:', 'Progress:')} {Math.round((completedLessons.size / (course?.lessons?.length || 1)) * 100)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* القائمة الجانبية للمحاضرات */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
              <ScrollArea className="h-[40vh] lg:h-[70vh] p-4">
                {course?.lessons?.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLesson(l)}
                    className={`w-full p-4 mb-3 rounded-2xl text-right transition-all duration-300 flex flex-col gap-1 border ${
                      selectedLesson?.id === l.id 
                      ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedLesson?.id === l.id ? 'text-blue-400' : 'text-slate-500'}`}>
                          Lesson {i + 1}
                        </span>
                        {completedLessons.has(l.id) && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="font-bold text-sm leading-tight mt-1">{language === 'ar' ? l.title_ar : l.title_en}</span>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          </div>

          {/* منطقة العرض الرئيسية */}
          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {selectedLesson && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                
                {/* دمج المشغل الآمن هنا بدل الرابط الخارجي */}
                <Card className="bg-black/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-6 relative w-full group backdrop-blur-sm p-1">
                  {selectedLesson.google_drive_video_id ? (
                    <SecureVideoPlayer 
                      videoId={selectedLesson.google_drive_video_id}
                      studentName={user?.user_metadata?.full_name || user?.email || 'طالب لوفيا'}
                      studentPhone={user?.user_metadata?.phone || ''}
                    />
                  ) : (
                    <div className="relative w-full aspect-video flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 to-slate-900 rounded-2xl border border-white/5">
                      <MonitorPlay className="w-20 h-20 text-slate-700 mb-4" />
                      <h2 className="text-xl font-black text-slate-400 px-4 text-center">
                        {t('عذراً، لا يوجد فيديو متاح لهذه المحاضرة حالياً', 'No video available for this lesson currently')}
                      </h2>
                    </div>
                  )}
                </Card>

                {/* زر تأكيد المشاهدة */}
                <Button
                    disabled={isLessonCompleted || markingComplete}
                    onClick={async () => {
                      if (!selectedLesson || !user) return;
                      setMarkingComplete(true);
                      try {
                          await markLessonComplete(user.id, selectedLesson.id);
                          setIsLessonCompleted(true);
                          setCompletedLessons(prev => new Set(prev).add(selectedLesson.id));
                          toast({ title: t('تم تأكيد المشاهدة بنجاح 🚀', 'Progress Saved 🚀') });
                      } catch (error) { toast({ title: "Error", variant: "destructive" }); }
                      finally { setMarkingComplete(false); }
                    }}
                    className={`w-full h-16 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 mb-6 border ${
                      isLessonCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent shadow-[0_10px_30px_rgba(37,99,235,0.2)]'
                    }`}
                >
                    {markingComplete ? <Clock className="animate-spin w-6 h-6" /> : isLessonCompleted ? <><ShieldCheck className="w-6 h-6" /> {t('تم إكمال المحاضرة', 'Completed')}</> : <><CheckCircle className="w-6 h-6" /> {t('أنهيت المشاهدة؟ افتح الواجب', 'Unlock Assignment')}</>}
                </Button>

                {/* الكروت السفلية (الواجب والملحقات) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* كارت الواجب */}
                  <Card className="bg-slate-900/40 border border-white/5 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-between hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{t('واجب المحاضرة', 'Quiz')}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {(!assignment || !assignment.questions || assignment.questions.length === 0) 
                                 ? t('لا يوجد واجب لهذه المحاضرة', 'No quiz available')
                                 : `${assignment.questions.length} ${t('أسئلة', 'Questions')}`}
                            </p>
                        </div>
                    </div>
                    
                    {isLessonCompleted ? (
                      (assignment && assignment.questions && assignment.questions.length > 0) ? (
                        assignmentSubmission ? (
                          <Button size="sm" onClick={() => setShowResult(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg h-9 px-5 font-bold transition-all">{t('النتيجة', 'Score')}</Button>
                        ) : (
                          <Button size="sm" onClick={() => { setCurrentQuestionIndex(0); setAssignmentAnswers({}); setAssignmentDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-lg h-9 px-5 font-bold transition-all">{t('ابدأ', 'Start')}</Button>
                        )
                      ) : (
                        <Badge variant="outline" className="text-slate-500 border-slate-800/50 bg-slate-900/50 text-[10px]">{t('غير متوفر', 'N/A')}</Badge>
                      )
                    ) : <Lock className="w-4 h-4 text-slate-600" />}
                  </Card>

                  {/* كارت الملحقات */}
                  <Card className={`bg-slate-900/40 border border-white/5 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-between transition-colors ${(!currentPdfUrl) ? 'opacity-60 grayscale' : 'hover:border-white/10'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{t('الملحقات', 'Resources')}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {currentPdfUrl ? t('عرض ملخص الـ PDF', 'View PDF') : t('لم يتم رفع ملفات', 'No files uploaded')}
                            </p>
                        </div>
                    </div>
                    {/* 👇 التعديل هنا: زرار بيفتح الـ Dialog بدل الـ a tag */}
                    {currentPdfUrl ? (
                        <button 
                          onClick={() => setIsPdfViewerOpen(true)} 
                          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </button>
                    ) : (
                        <Info className="w-4 h-4 text-slate-600" />
                    )}
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 👇 المودال الجديد لعرض الملحق (PDF) مع الـ Watermark */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] bg-slate-950/95 backdrop-blur-2xl border border-white/10 p-0 flex flex-col overflow-hidden rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="p-4 border-b border-white/5 bg-slate-900/50 flex flex-row items-center justify-between z-20 relative">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <BookOpen className="w-5 h-5 text-blue-400" />
               </div>
               <DialogTitle className="text-lg font-bold text-white">{t('عرض الملحق', 'View Document')}</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
          
          <div 
            className="flex-1 relative bg-slate-900 overflow-hidden select-none" 
            onContextMenu={(e) => e.preventDefault()} // منع كليك يمين
          >
            {/* الووتر مارك (Watermark) المكررة على الشاشة كلها */}
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-wrap items-center justify-center overflow-hidden opacity-[0.05]">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="transform -rotate-45 text-white text-2xl font-black p-10 whitespace-nowrap">
                  {user?.user_metadata?.full_name || user?.email} <br /> {user?.user_metadata?.phone || ''}
                </div>
              ))}
            </div>
            
            {/* عرض الـ PDF (إخفاء الـ Toolbar لو المتصفح بيدعم ده) */}
            <iframe 
               src={`${currentPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
               className="w-full h-full border-none relative z-10"
               title="Secure PDF Viewer"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* المودال الخاص بالواجبات */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[100dvh] md:h-[85vh] bg-slate-950/95 backdrop-blur-2xl border-none md:border md:border-white/10 p-0 flex flex-col overflow-hidden md:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="p-5 md:p-8 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"><FileQuestion className="w-6 h-6 text-purple-400" /></div>
              <div>
                <DialogTitle className="text-base md:text-xl font-black text-white">{language === 'ar' ? assignment?.title_ar : assignment?.title_en}</DialogTitle>
                <div className="w-32 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" animate={{ width: `${((currentQuestionIndex + 1) / (assignment?.questions?.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <DialogClose asChild><Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"><X className="w-5 h-5" /></Button></DialogClose>
          </div>
          <div className="flex-1 relative overflow-y-auto p-6 md:p-12">
            <AnimatePresence mode="wait">
              {assignment?.questions?.[currentQuestionIndex] && (
                <motion.div key={currentQuestionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto mt-4">
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-10 leading-snug">{language === 'ar' ? assignment.questions[currentQuestionIndex].question_text_ar : assignment.questions[currentQuestionIndex].question_text_en}</h2>
                    <div className="space-y-4">
                      {assignment.questions[currentQuestionIndex].options.map((opt) => {
                        const isSelected = assignmentAnswers[assignment.questions[currentQuestionIndex].id]?.includes(opt.id);
                        return (
                          <Label key={opt.id} className={`flex items-center gap-5 p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${isSelected ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'}`}>
                            <Checkbox checked={isSelected || false} onCheckedChange={() => handleAnswer(assignment.questions[currentQuestionIndex].id, opt.id, assignment.questions[currentQuestionIndex].question_type === 'multiple_choice')} className="sr-only" />
                            <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}`}>{isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}</div>
                            <span className="text-lg font-medium leading-relaxed">{language === 'ar' ? opt.text_ar : opt.text_en}</span>
                          </Label>
                        );
                      })}
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-5 md:p-8 border-t border-white/5 bg-slate-900/50 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0} className="text-slate-400 hover:text-white hover:bg-white/5 h-12 px-6 rounded-xl">
              <ChevronLeft className="w-5 h-5 ml-2" /> {t('السابق', 'Back')}
            </Button>
            {currentQuestionIndex === (assignment?.questions?.length || 0) - 1 ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-10 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] text-lg transition-all">{t('تسليم الواجب', 'Submit Quiz')}</Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-white text-black hover:bg-slate-200 h-12 px-10 rounded-xl font-bold text-lg transition-all">{t('التالي', 'Next')}</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد التسليم */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] text-center p-10 max-w-md shadow-2xl">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <AlertCircle className="w-12 h-12 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-black text-white mb-2">{t('هل أنت متأكد؟', 'Are you sure?')}</DialogTitle>
          <p className="text-slate-400 text-sm mb-8">{t('لن تتمكن من تعديل إجاباتك بعد التسليم.', 'You cannot change your answers after submission.')}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={executeSubmission} disabled={assignmentSubmitting} className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              {assignmentSubmitting ? <Clock className="animate-spin w-6 h-6" /> : t('نعم، قم بالتسليم', 'Yes, Submit')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)} className="w-full h-14 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">{t('مراجعة الإجابات', 'Review Answers')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نتيجة الواجب */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 text-center shadow-[0_0_50px_rgba(37,99,235,0.2)]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
              <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                <Trophy className="w-16 h-16 text-blue-400 relative z-10" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-black text-slate-300">{t('درجتك هي', 'Your Score')}</h2>
            <div className="text-7xl font-black text-white my-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{assignmentSubmission?.score}%</div>
            <Button onClick={() => setShowResult(false)} className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg mt-4 shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-transform">{t('إغلاق', 'Close')}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}