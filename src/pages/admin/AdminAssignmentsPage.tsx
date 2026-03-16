import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, createAssignment, getAssignmentsByLesson, getAssignmentSubmissions } from '@/db/api';
import type { Course, Lesson, Assignment, AssignmentSubmission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, ClipboardList, Trash2, Eye, BookOpen, Layers, Calendar, HelpCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminAssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title_ar: '', title_en: '',
    description_ar: '', description_en: '',
    due_date: '',
    questions: [] as any[],
  });

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourseId) loadLessons(); }, [selectedCourseId]);
  useEffect(() => { if (selectedLessonId) loadAssignments(); }, [selectedLessonId]);

  const loadCourses = async () => { try { setCourses(await getAllCourses(false)); } catch (e) { console.error(e); } };
  const loadLessons = async () => { try { setLessons(await getLessonsByCourse(selectedCourseId)); } catch (e) { console.error(e); } };
  const loadAssignments = async () => { try { setAssignments(await getAssignmentsByLesson(selectedLessonId)); } catch (e) { console.error(e); } };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, {
        question_ar: '', question_en: '', type: 'single',
        options: [{ text_ar: '', text_en: '' }, { text_ar: '', text_en: '' }],
        correct_answers: [],
      }],
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIdx: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIdx].options.push({ text_ar: '', text_en: '' });
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIdx: number, oIdx: number, field: any, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIdx].options[oIdx][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const toggleCorrectAnswer = (qIdx: number, oIdx: number) => {
    const newQuestions = [...formData.questions];
    const q = newQuestions[qIdx];
    if (q.type === 'single') q.correct_answers = [oIdx];
    else {
      const i = q.correct_answers.indexOf(oIdx);
      i > -1 ? q.correct_answers.splice(i, 1) : q.correct_answers.push(oIdx);
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssignment({ ...formData, course_id: selectedCourseId, lesson_id: selectedLessonId } as any);
      toast({ title: t('تم', 'Success'), description: t('تم إنشاء الواجب', 'Created') });
      setDialogOpen(false); loadAssignments(); resetForm();
    } catch (err: any) {
      toast({ title: t('خطأ', 'Error'), description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => setFormData({ title_ar: '', title_en: '', description_ar: '', description_en: '', due_date: '', questions: [] });

  const handleViewResults = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    try {
      setSubmissions(await getAssignmentSubmissions(assignment.id));
      setResultsDialogOpen(true);
    } catch (e) { toast({ title: t('خطأ', 'Error'), variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="ltr">
      {/* Selection Cards - Stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#0a0f1e] border-white/5 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-blue-400 uppercase tracking-widest">
              <BookOpen className="w-4 h-4" /> {t('الكورس', 'Course Selection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-black/20 border-white/10 rounded-xl h-12">
                <SelectValue placeholder={t('اختر كورس', 'Select a course')} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{language === 'ar' ? c.title_ar : c.title_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0f1e] border-white/5 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-400 uppercase tracking-widest">
              <Layers className="w-4 h-4" /> {t('الدرس', 'Lesson Selection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLessonId} onValueChange={setSelectedLessonId} disabled={!selectedCourseId}>
              <SelectTrigger className="bg-black/20 border-white/10 rounded-xl h-12">
                <SelectValue placeholder={t('اختر درس', 'Select a lesson')} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                {lessons.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{language === 'ar' ? l.title_ar : l.title_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table Card */}
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 p-6 md:p-8">
          <div>
            <CardTitle className="text-2xl font-black italic">{t('الواجبات', 'ASSIGNMENTS')}</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {t('إدارة الأسئلة ومتابعة نتائج الطلاب', 'Monitor student task performance')}
            </CardDescription>
          </div>
          
          {selectedLessonId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-blue-900/20">
                  <Plus className="w-4 h-4 mr-2" /> {t('إضافة واجب', 'New Assignment')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-[#0a0f1e] border-white/10 text-white rounded-[2rem] p-4 md:p-10 custom-scrollbar">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-3xl font-black italic">{t('إنشاء واجب جديد', 'NEW ASSIGNMENT')}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Info - Title & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('العنوان (AR)', 'Title AR')}</Label>
                      <Input className="bg-white/5 border-white/10 h-12 rounded-xl" value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} required />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('العنوان (EN)', 'Title EN')}</Label>
                      <Input className="bg-white/5 border-white/10 h-12 rounded-xl" value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (AR)', 'Desc AR')}</Label>
                      <Textarea className="bg-white/5 border-white/10 rounded-xl" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (EN)', 'Desc EN')}</Label>
                      <Textarea className="bg-white/5 border-white/10 rounded-xl" value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                    <Calendar className="text-blue-500 w-5 h-5" />
                    <div className="flex-1">
                      <Label className="text-[10px] font-black uppercase text-blue-500/60 mb-1 block">{t('تاريخ التسليم', 'Due Date')}</Label>
                      <Input type="date" className="bg-transparent border-none p-0 h-auto text-blue-100" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                      <h3 className="text-lg font-black italic flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-500"/> {t('الأسئلة', 'QUESTIONS')}</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <Plus className="h-4 w-4 mr-1" /> {t('إضافة سؤال', 'Add')}
                      </Button>
                    </div>

                    {formData.questions.map((q, qIdx) => (
                      <Card key={qIdx} className="bg-black/20 border-white/5 rounded-[1.5rem] overflow-hidden">
                        <CardHeader className="bg-white/5 p-4 flex flex-row justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Question #{qIdx + 1}</span>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => {
                            const n = [...formData.questions]; n.splice(qIdx, 1); setFormData({...formData, questions: n});
                          }}><Trash2 className="w-4 h-4"/></Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Question (AR)" className="bg-white/5 h-11" value={q.question_ar} onChange={(e) => updateQuestion(qIdx, 'question_ar', e.target.value)} />
                            <Input placeholder="Question (EN)" className="bg-white/5 h-11" value={q.question_en} onChange={(e) => updateQuestion(qIdx, 'question_en', e.target.value)} />
                          </div>
                          
                          <Select value={q.type} onValueChange={(v) => updateQuestion(qIdx, 'type', v)}>
                            <SelectTrigger className="bg-white/5 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#0a0f1e] text-white">
                              <SelectItem value="single">{t('اختيار واحد', 'Single')}</SelectItem>
                              <SelectItem value="multiple">{t('متعدد', 'Multiple')}</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase opacity-50">{t('الخيارات', 'Options')}</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="h-6 text-[10px] uppercase font-bold text-blue-400">+ Add Option</Button></div>
                            
                            {q.options.map((opt: any, oIdx: number) => (
                              <div key={oIdx} className="flex flex-col md:flex-row gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-2 pt-2 md:pt-0">
                                  {q.type === 'single' ? (
                                    <RadioGroup value={q.correct_answers[0]?.toString()} onValueChange={() => toggleCorrectAnswer(qIdx, oIdx)}>
                                      <RadioGroupItem value={oIdx.toString()} className="border-blue-500" />
                                    </RadioGroup>
                                  ) : (
                                    <Checkbox checked={q.correct_answers.includes(oIdx)} onCheckedChange={() => toggleCorrectAnswer(qIdx, oIdx)} className="border-blue-500" />
                                  )}
                                </div>
                                <Input placeholder="AR" className="h-9 text-xs bg-transparent" value={opt.text_ar} onChange={(e) => updateOption(qIdx, oIdx, 'text_ar', e.target.value)} />
                                <Input placeholder="EN" className="h-9 text-xs bg-transparent" value={opt.text_en} onChange={(e) => updateOption(qIdx, oIdx, 'text_en', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
                    <Button type="submit" className="bg-blue-600 px-10 rounded-xl">{t('إنشاء', 'Create')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {!selectedLessonId ? (
            <div className="text-center py-20">
              <ClipboardList className="h-20 w-20 mx-auto mb-4 opacity-10 text-blue-500" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('اختر درساً أولاً', 'Select a lesson to view tasks')}</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground italic">{t('لا توجد واجبات', 'Empty Lab')}</div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8">{t('العنوان', 'Title')}</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('التاريخ', 'Due Date')}</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-8">{t('الإجراءات', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold py-6 px-8">{language === 'ar' ? a.title_ar : a.title_en}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button variant="ghost" size="sm" onClick={() => handleViewResults(a)} className="rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                          <Eye className="h-4 w-4 mr-2" /> {t('النتائج', 'Results')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#0a0f1e] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
              {t('نتائج الطلاب', 'STUDENT RESULTS')}
            </DialogTitle>
            <DialogDescription className="text-blue-500 font-bold">
              {selectedAssignment && (language === 'ar' ? selectedAssignment.title_ar : selectedAssignment.title_en)}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {submissions.length === 0 ? (
              <p className="text-center py-12 text-slate-600 font-mono tracking-widest uppercase text-xs">No entries found_</p>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-4">{t('الطالب', 'Student')}</TableHead>
                    <TableHead>{t('الدرجة', 'Score')}</TableHead>
                    <TableHead>{t('التاريخ', 'Date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold">{s.profiles?.name || '-'}</TableCell>
                      <TableCell className="font-mono text-emerald-500 font-bold">{s.score} / {s.total_score}</TableCell>
                      <TableCell className="text-xs text-slate-500">{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}