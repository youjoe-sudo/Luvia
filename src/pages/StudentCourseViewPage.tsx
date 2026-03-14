import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  Download,
  ClipboardList,
  BookOpen,
  Lock,
  Award,
  Clock,
  ChevronRight,
  ChevronLeft,
  Layout,
  X,
  AlertCircle,
  MonitorPlay,
  FileQuestion,
  Trophy,
  PartyPopper,
  ShieldCheck
} from 'lucide-react';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';

export default function StudentCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // --- Core States ---
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);

  // --- Assignment Logic States ---
  const [assignment, setAssignment] = useState<AssignmentWithQuestions | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string[]>>({});
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // --- Loading Logic ---
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
    const [att, comp, assign] = await Promise.all([
      getLessonAttachments(selectedLesson.id),
      checkLessonCompletion(user.id, selectedLesson.id),
      getAssignmentsByLesson(selectedLesson.id)
    ]);
    setAttachments(att);
    setIsLessonCompleted(comp);
    if (assign?.length > 0) {
      const fullAssign = await getAssignmentWithQuestions(assign[0].id);
      const sub = await getAssignmentSubmission(assign[0].id, user.id);
      setAssignment(fullAssign);
      setAssignmentSubmission(sub);
    }
  }, [selectedLesson, user]);

  useEffect(() => { loadLessonExtras(); }, [loadLessonExtras]);

  // --- Handlers ---
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
      setShowResult(true); // إظهار النتيجة الرايقة
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (assignment && currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Skeleton className="w-[80%] h-32 rounded-3xl" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="container py-10 relative z-10">
        {/* Header & Main Content (نفس التصميم السابق مع تحسينات طفيفة) */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-white">{language === 'ar' ? course?.title_ar : course?.title_en}</h1>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20 px-4 py-2 rounded-xl">
            Progress: {Math.round((completedLessons.size / (course?.lessons?.length || 1)) * 100)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#0f172a]/50 border-white/5 backdrop-blur-2xl rounded-[2rem]">
              <ScrollArea className="h-[70vh] p-4">
                {course?.lessons?.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLesson(l)}
                    className={`w-full p-4 mb-2 rounded-2xl text-right transition-all ${selectedLesson?.id === l.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-300'}`}
                  >
                    <span className="text-xs opacity-50 block mb-1">LESSON {i + 1}</span>
                    <span className="font-bold block">{language === 'ar' ? l.title_ar : l.title_en}</span>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          </div>

          {/* Viewer */}
          <div className="lg:col-span-3 space-y-6">
            {selectedLesson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-black border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
                  <SecureVideoPlayer videoId={selectedLesson.google_drive_video_id || ''} watermarkText={user?.email || ''} />
                </Card>
{/* زر إكمال المحاضرة - تحت الفيديو مباشرة */}
<motion.div 
  initial={{ opacity: 0, y: 10 }} 
  animate={{ opacity: 1, y: 0 }}
  className="mb-8"
>
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
      } catch (error) {
        toast({ title: "Error", variant: "destructive" });
      } finally {
        setMarkingComplete(false);
      }
    }}
    className={`w-full h-16 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 ${
      isLessonCompleted 
      ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default' 
      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]'
    }`}
  >
    {markingComplete ? (
      <Clock className="animate-spin w-6 h-6" />
    ) : isLessonCompleted ? (
      <>
        <ShieldCheck className="w-6 h-6" />
        {t('تم إكمال هذه المحاضرة بنجاح', 'Lesson Completed Successfully')}
      </>
    ) : (
      <>
        <MonitorPlay className="w-6 h-6" />
        {t('لقد شاهدت المحاضرة، افتح الواجب الآن', 'I watched the lesson, unlock assignment')}
      </>
    )}
  </Button>
</motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assignment Card */}
                  <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 text-center">
                    <ClipboardList className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-4">{t('الواجب المنزلي', 'Lesson Assignment')}</h3>
                    {isLessonCompleted ? (
                      assignmentSubmission ? (
                        <Button onClick={() => setShowResult(true)} variant="outline" className="rounded-xl border-purple-500/30 text-purple-400">
                          {t('عرض النتيجة', 'View Result')}
                        </Button>
                      ) : (
                        <Button onClick={() => setAssignmentDialogOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-10">
                          {t('ابدأ الحل', 'Start Assignment')}
                        </Button>
                      )
                    ) : (
                      <p className="text-slate-500 text-sm italic">{t('أكمل الدرس أولاً لفتح الواجب', 'Complete lesson to unlock')}</p>
                    )}
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* --- ASSIGNMENT DIALOG (The Interactive Stepper) --- */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] bg-[#020617] border-white/10 rounded-[3rem] p-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <FileQuestion className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white">{language === 'ar' ? assignment?.title_ar : assignment?.title_en}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500"
                      animate={{ width: `${((currentQuestionIndex + 1) / (assignment?.questions.length || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Q {currentQuestionIndex + 1} / {assignment?.questions.length}</span>
                </div>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></Button>
            </DialogClose>
          </div>

          {/* Interactive Question Body */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {assignment && (
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="absolute inset-0 p-8 md:p-16 overflow-y-auto"
                >
                  <div className="max-w-2xl mx-auto space-y-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {language === 'ar' ? assignment.questions[currentQuestionIndex].question_text_ar : assignment.questions[currentQuestionIndex].question_text_en}
                    </h2>

                    <div className="space-y-4">
                      {assignment.questions[currentQuestionIndex].options.map((opt) => {
                        const isSelected = assignmentAnswers[assignment.questions[currentQuestionIndex].id]?.includes(opt.id);
                        return (
                          <Label
                            key={opt.id}
                            className={`flex items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer group ${isSelected
                                ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                : 'bg-white/10 border-white/20 text-slate-100 hover:bg-white/20 hover:border-white/40'
                              }`}
                          >
                            <Checkbox
                              checked={isSelected || false}
                              onCheckedChange={() => handleAnswer(assignment.questions[currentQuestionIndex].id, opt.id, assignment.questions[currentQuestionIndex].question_type === 'multiple_choice')}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-700'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            </div>
                            <span className="text-lg font-medium">{language === 'ar' ? opt.text_ar : opt.text_en}</span>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Footer */}
          <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              <ChevronLeft className="mr-2 w-5 h-5" /> {t('السابق', 'Back')}
            </Button>

            <div className="flex gap-2">
              {assignment?.questions.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentQuestionIndex ? 'bg-purple-500 w-6' : 'bg-white/10'}`} />
              ))}
            </div>

            {assignment && currentQuestionIndex === assignment.questions.length - 1 ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-8 font-black">
                {t('إنهاء وتسليم', 'Finish & Submit')}
              </Button>
            ) : (
              <Button onClick={nextQuestion} className="bg-white text-black hover:bg-slate-200 rounded-xl px-8 font-black">
                {t('التالي', 'Next')} <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRMATION DIALOG --- */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 rounded-[2rem] text-center p-10">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <DialogTitle className="text-2xl font-black text-white">{t('هل أنت متأكد من التسليم؟', 'Ready to Submit?')}</DialogTitle>
          <p className="text-slate-400 mt-2">
            {t('لقد قمت بالإجابة على ', 'You answered ')}
            <span className="text-white font-bold">{Object.keys(assignmentAnswers).length}</span>
            {t(' من أصل ', ' out of ')}
            <span className="text-white font-bold">{assignment?.questions.length}</span>
            {t(' سؤالاً.', ' questions.')}
          </p>
          <DialogFooter className="mt-8 flex gap-4 sm:justify-center">
            <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)} className="rounded-xl text-slate-400">راجع الإجابات</Button>
            <Button onClick={executeSubmission} disabled={assignmentSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold">
              {assignmentSubmitting ? <Clock className="animate-spin" /> : t('نعم، سلم الآن', 'Yes, Submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- RESULT CELEBRATION MODAL --- */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md bg-[#020617] border-white/10 rounded-[3rem] p-10 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full" />
          </div>

          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">{t('أحسنت يا بطل!', 'Excellent Work!')}</h2>
            <p className="text-slate-400 mb-8">{t('لقد أتممت حل الواجب بنجاح.', 'Assignment completed successfully.')}</p>

            <div className="relative w-40 h-40 mx-auto mb-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <motion.circle
                  cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * (assignmentSubmission?.score || 0)) / 100 }}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{assignmentSubmission?.score}%</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t('الإجابات الصحيحة', 'Correct')}</p>
                <p className="text-xl font-black text-green-400">{Math.round(((assignmentSubmission?.score || 0) / 100) * (assignmentSubmission?.total_questions || 0))}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t('إجمالي الأسئلة', 'Total')}</p>
                <p className="text-xl font-black text-white">{assignmentSubmission?.total_questions || 0}</p>
              </div>
            </div>

            <Button onClick={() => setShowResult(false)} className="w-full h-14 bg-white text-black hover:bg-slate-200 rounded-2xl font-black text-lg">
              {t('العودة للدرس', 'Back to Lesson')}
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}