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
  Play,
  ExternalLink,
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

  const handleWatchVideo = () => {
    if (selectedLesson?.google_drive_video_id) {
        const driveUrl = `https://drive.google.com/file/d/${selectedLesson.google_drive_video_id}/view`;
        window.open(driveUrl, '_blank');
    } else {
        toast({ title: "عذراً", description: "رابط المحاضرة غير متوفر", variant: "destructive" });
    }
  };

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

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Skeleton className="w-[80%] h-32 rounded-3xl" /></div>;

  // التحقق من وجود PDF بأمان لتفادي خطأ TS
  const currentPdfUrl = (selectedLesson as any)?.pdf_url;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="container py-6 md:py-10 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white">{language === 'ar' ? course?.title_ar : course?.title_en}</h1>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold">
            {t('التقدم:', 'Progress:')} {Math.round((completedLessons.size / (course?.lessons?.length || 1)) * 100)}%
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-[#0f172a]/50 border-white/5 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
              <ScrollArea className="h-[40vh] lg:h-[70vh] p-4">
                {course?.lessons?.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLesson(l)}
                    className={`w-full p-4 mb-3 rounded-2xl text-right transition-all flex flex-col gap-1 ${selectedLesson?.id === l.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase">Lesson {i + 1}</span>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                
                <Card className="bg-[#0f172a] border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-6 relative w-full group">
                  <div className="relative w-full aspect-video flex flex-col items-center justify-center bg-gradient-to-t from-black to-blue-950/30">
                    <div 
                      className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(37,99,235,0.5)] z-10"
                      onClick={handleWatchVideo}
                    >
                      <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                    <h2 className="mt-6 text-xl font-black text-white px-4 text-center z-10">{language === 'ar' ? selectedLesson.title_ar : selectedLesson.title_en}</h2>
                    <div className="mt-2 flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest opacity-80 z-10">
                        <ExternalLink className="w-3 h-3" />
                        {t('فتح المحاضرة على Drive', 'Open Lecture on Drive')}
                    </div>
                    <MonitorPlay className="w-40 h-40 text-white/5 absolute pointer-events-none" />
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
                          toast({ title: t('تم تأكيد المشاهدة', 'Confirmed!') });
                      } catch (error) { toast({ title: "Error", variant: "destructive" }); }
                      finally { setMarkingComplete(false); }
                    }}
                    className={`w-full h-16 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mb-6 ${
                      isLessonCompleted 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20'
                    }`}
                >
                    {markingComplete ? <Clock className="animate-spin w-6 h-6" /> : isLessonCompleted ? <><ShieldCheck className="w-6 h-6" /> {t('تم إكمال المحاضرة', 'Completed')}</> : <><CheckCircle className="w-6 h-6" /> {t('أنهيت المشاهدة؟ افتح الواجب', 'Unlock Assignment')}</>}
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400"><ClipboardList className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{t('واجب المحاضرة', 'Quiz')}</h4>
                            <p className="text-[10px] text-slate-500">
                                {(!assignment || !assignment.questions || assignment.questions.length === 0) 
                                 ? t('لا يوجد واجب لهذه المحاضرة', 'No quiz available')
                                 : `${assignment.questions.length} ${t('أسئلة', 'Questions')}`}
                            </p>
                        </div>
                    </div>
                    
                    {isLessonCompleted ? (
                      (assignment && assignment.questions && assignment.questions.length > 0) ? (
                        assignmentSubmission ? (
                          <Button size="sm" onClick={() => setShowResult(true)} variant="secondary" className="rounded-lg h-8 px-4">{t('النتيجة', 'Score')}</Button>
                        ) : (
                          <Button size="sm" onClick={() => { setCurrentQuestionIndex(0); setAssignmentAnswers({}); setAssignmentDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-500 rounded-lg h-8 px-4">{t('ابدأ', 'Start')}</Button>
                        )
                      ) : (
                        <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px]">{t('غير متوفر', 'N/A')}</Badge>
                      )
                    ) : <Lock className="w-4 h-4 text-slate-600" />}
                  </Card>

                  <Card className={`bg-white/[0.03] border-white/5 rounded-2xl p-6 flex items-center justify-between ${(!currentPdfUrl) ? 'opacity-70' : 'cursor-pointer hover:bg-white/[0.05]'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400"><BookOpen className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{t('الملحقات', 'Resources')}</h4>
                            <p className="text-[10px] text-slate-500">
                                {currentPdfUrl ? t('تحميل ملخص PDF', 'Download PDF') : t('لم يتم رفع ملفات', 'No files uploaded')}
                            </p>
                        </div>
                    </div>
                    {currentPdfUrl ? (
                        <a href={currentPdfUrl} target="_blank" rel="noreferrer">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </a>
                    ) : (
                        <Info className="w-4 h-4 text-slate-700" />
                    )}
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
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30"><FileQuestion className="w-5 h-5 text-purple-400" /></div>
              <div>
                <DialogTitle className="text-base md:text-xl font-black text-white">{language === 'ar' ? assignment?.title_ar : assignment?.title_en}</DialogTitle>
                <div className="w-24 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div className="h-full bg-purple-500" animate={{ width: `${((currentQuestionIndex + 1) / (assignment?.questions?.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <DialogClose asChild><Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 text-slate-400"><X className="w-5 h-5" /></Button></DialogClose>
          </div>
          <div className="flex-1 relative overflow-y-auto p-6 md:p-16">
            <AnimatePresence mode="wait">
              {assignment?.questions?.[currentQuestionIndex] && (
                <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-8">{language === 'ar' ? assignment.questions[currentQuestionIndex].question_text_ar : assignment.questions[currentQuestionIndex].question_text_en}</h2>
                    <div className="space-y-3">
                      {assignment.questions[currentQuestionIndex].options.map((opt) => {
                        const isSelected = assignmentAnswers[assignment.questions[currentQuestionIndex].id]?.includes(opt.id);
                        return (
                          <Label key={opt.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                            <Checkbox checked={isSelected || false} onCheckedChange={() => handleAnswer(assignment.questions[currentQuestionIndex].id, opt.id, assignment.questions[currentQuestionIndex].question_type === 'multiple_choice')} className="sr-only" />
                            <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-700'}`}>{isSelected && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                            <span className="text-base font-medium">{language === 'ar' ? opt.text_ar : opt.text_en}</span>
                          </Label>
                        );
                      })}
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-5 md:p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0} className="text-slate-400">
              <ChevronLeft className="w-4 h-4 ml-1" /> {t('السابق', 'Back')}
            </Button>
            {currentQuestionIndex === (assignment?.questions?.length || 0) - 1 ? (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-green-600 hover:bg-green-500 text-white px-8 rounded-xl font-bold">تسليم</Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-white text-black hover:bg-slate-200 px-8 rounded-xl font-bold">التالي</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm & Result */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 rounded-[2rem] text-center p-10 max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <DialogTitle className="text-xl font-bold text-white">هل تريد التسليم الآن؟</DialogTitle>
          <div className="flex gap-3 mt-8">
            <Button variant="ghost" onClick={() => setConfirmSubmitOpen(false)} className="w-full rounded-xl text-slate-400">مراجعة</Button>
            <Button onClick={executeSubmission} disabled={assignmentSubmitting} className="w-full bg-blue-600 text-white rounded-xl font-bold">{assignmentSubmitting ? <Clock className="animate-spin" /> : 'نعم، سلم'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md bg-[#020617] border-white/10 rounded-[2.5rem] p-10 text-center">
            <Trophy className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white">درجتك هي</h2>
            <div className="text-6xl font-black text-blue-500 my-6">{assignmentSubmission?.score}%</div>
            <Button onClick={() => setShowResult(false)} className="w-full h-14 bg-white text-black rounded-2xl font-black">إغلاق</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}