import { useEffect, useState, useCallback, useRef } from 'react';
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
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';

export default function StudentCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const videoRef = useRef<any>(null);

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Skeleton className="w-[80%] h-32 rounded-3xl" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="container py-6 md:py-10 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white">{language === 'ar' ? course?.title_ar : course?.title_en}</h1>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20 px-4 py-2 rounded-xl whitespace-nowrap">
            {t('التقدم:', 'Progress:')} {Math.round((completedLessons.size / (course?.lessons?.length || 1)) * 100)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 ml-2">{t('محتوى الكورس', 'Course Content')}</h3>
            <Card className="bg-[#0f172a]/50 border-white/5 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <ScrollArea className="h-[40vh] lg:h-[70vh] p-4">
                {course?.lessons?.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => {
                        setSelectedLesson(l);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full p-4 mb-3 rounded-2xl text-right transition-all flex flex-col gap-1 ${selectedLesson?.id === l.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Lesson {i + 1}</span>
                        {completedLessons.has(l.id) && <ShieldCheck className="w-4 h-4 text-green-400" />}
                    </div>
                    <span className="font-bold text-sm leading-tight">{language === 'ar' ? l.title_ar : l.title_en}</span>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
            {selectedLesson && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                {/* Fixed Video Aspect Ratio Section */}
                <Card className="bg-black border-none rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl mb-6 relative w-full">
                   <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <div className="absolute inset-0 w-full h-full">
                      <SecureVideoPlayer 
                        videoId={selectedLesson?.google_drive_video_id || ''} 
                        watermarkText={user?.email || ''} 
                      />
                    </div>
                  </div>
                </Card>

                <Button
                    disabled={isLessonCompleted || markingComplete}
                    onClick={async () => {
                      if (!selectedLesson || !user) return;
                      setMarkingComplete(true);
                      try {
                          await markLessonComplete(user.id, selectedLesson.id);
                          setIsLessonCompleted(true);
                          setCompletedLessons(prev => new Set(prev).add(selectedLesson.id));
                          toast({ title: t('عاش يا بطل! تم فتح الواجب', 'Great job! Assignment unlocked') });
                      } catch (error) { toast({ title: "Error", variant: "destructive" }); }
                      finally { setMarkingComplete(false); }
                    }}
                    className={`w-full h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mb-6 ${
                      isLessonCompleted 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20'
                    }`}
                >
                    {markingComplete ? <Clock className="animate-spin w-6 h-6" /> : isLessonCompleted ? <><ShieldCheck className="w-6 h-6" /> {t('تمت المشاهدة', 'Lesson Completed')}</> : <><MonitorPlay className="w-6 h-6" /> {t('أنهيت المشاهدة؟ افتح الواجب', 'Finished? Unlock Assignment')}</>}
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">{t('واجب المحاضرة', 'Lesson Quiz')}</h4>
                            <p className="text-xs text-slate-500">{assignment?.questions?.length || 0} {t('أسئلة متنوعة', 'Questions')}</p>
                        </div>
                    </div>
                    {isLessonCompleted ? (
                      assignmentSubmission ? (
                        <Button size="sm" onClick={() => setShowResult(true)} variant="secondary" className="rounded-lg">{t('النتيجة', 'Score')}</Button>
                      ) : (
                        <Button size="sm" onClick={() => {
                            setCurrentQuestionIndex(0);
                            setAssignmentAnswers({});
                            setAssignmentDialogOpen(true);
                        }} className="bg-purple-600 hover:bg-purple-500 rounded-lg">{t('بدء', 'Start')}</Button>
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </Card>

                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">{t('ملخص PDF', 'Lesson PDF')}</h4>
                            <p className="text-xs text-slate-500">{t('تحميل الملحقات', 'Download files')}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[100dvh] md:h-[85vh] bg-[#020617] border-none md:border md:border-white/10 p-0 flex flex-col overflow-hidden md:rounded-[3rem]">
          <div className="p-5 md:p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <FileQuestion className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-base md:text-xl font-black text-white line-clamp-1">
                    {language === 'ar' ? assignment?.title_ar : assignment?.title_en}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Q {currentQuestionIndex + 1} / {assignment?.questions?.length || 0}</span>
                    <div className="w-20 md:w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-purple-500" animate={{ width: `${((currentQuestionIndex + 1) / (assignment?.questions?.length || 1)) * 100}%` }} />
                    </div>
                </div>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 text-slate-400"><X className="w-5 h-5" /></Button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-hidden relative bg-[#020617]">
            <AnimatePresence mode="wait">
              {assignment && assignment.questions && (
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 p-6 md:p-16 overflow-y-auto"
                >
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-snug mb-8">
                      {language === 'ar' ? assignment.questions[currentQuestionIndex]?.question_text_ar : assignment.questions[currentQuestionIndex]?.question_text_en}
                    </h2>

                    <div className="space-y-3 md:space-y-4">
                      {assignment.questions[currentQuestionIndex]?.options?.map((opt) => {
                        const isSelected = assignmentAnswers[assignment.questions[currentQuestionIndex].id]?.includes(opt.id);
                        return (
                          <Label
                            key={opt.id}
                            className={`flex items-center gap-4 p-5 md:p-6 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                                ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-900/10'
                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                              }`}
                          >
                            <Checkbox
                              checked={isSelected || false}
                              onCheckedChange={() => handleAnswer(assignment.questions[currentQuestionIndex].id, opt.id, assignment.questions[currentQuestionIndex].question_type === 'multiple_choice')}
                              className="sr-only"
                            />
                            <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-700'}`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-base md:text-lg font-medium leading-tight">{language === 'ar' ? opt.text_ar : opt.text_en}</span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-5 md:p-8 border-t border-white/5 bg-white/5 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
              className="text-slate-400 h-12 rounded-xl px-4"
            >
              <ChevronLeft className="md:mr-2 w-5 h-5" /> <span className="hidden md:inline">{t('السابق', 'Back')}</span>
            </Button>

            <div className="hidden md:flex gap-2">
              {assignment?.questions?.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentQuestionIndex ? 'bg-purple-500 w-4' : 'bg-white/10'}`} />
              ))}
            </div>

            {assignment && currentQuestionIndex === (assignment.questions?.length || 0) - 1 ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-green-600 hover:bg-green-500 text-white h-12 px-6 rounded-xl font-black">
                {t('تسليم', 'Submit')}
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-white text-black hover:bg-slate-200 h-12 px-6 rounded-xl font-black">
                {t('التالي', 'Next')} <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 rounded-[2rem] text-center p-10 max-w-[90vw] md:max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <DialogTitle className="text-2xl font-black text-white">{t('هل أنت متأكد؟', 'Ready?')}</DialogTitle>
          <p className="text-slate-400 mt-2">
            {t('سيتم تقييم إجاباتك الآن.', 'Your answers will be graded now.')}
          </p>
          <DialogFooter className="mt-8 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)} className="w-full rounded-xl">راجع ثانية</Button>
            <Button onClick={executeSubmission} disabled={assignmentSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">
              {assignmentSubmitting ? <Clock className="animate-spin" /> : t('نعم، سلم', 'Submit Now')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md w-[95vw] bg-[#020617] border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 text-center overflow-hidden">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">{t('درجتك هي', 'Your Score')}</h2>
            
            <div className="text-6xl font-black text-blue-500 my-6">
                {assignmentSubmission?.score}%
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t('صحيح', 'Correct')}</p>
                <p className="text-xl font-black text-green-400">{Math.round(((assignmentSubmission?.score || 0) / 100) * (assignmentSubmission?.total_questions || 0))}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t('الأسئلة', 'Questions')}</p>
                <p className="text-xl font-black text-white">{assignmentSubmission?.total_questions || 0}</p>
              </div>
            </div>

            <Button onClick={() => setShowResult(false)} className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-2xl font-black">
              {t('إغلاق', 'Close')}
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}