import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getAllCourses, 
  getLessonsByCourse, 
  createAssignment, 
  getAssignmentsByLesson, 
  getAssignmentSubmissions 
} from '@/db/api';
import type { Course, Lesson, Assignment, AssignmentSubmission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'; // أضفنا DialogDescription هنا
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, Eye, FileUp, FileDown, 
  LayoutGrid, Sparkles, BookOpen, Layers, Target, CheckCircle2, Circle
} from 'lucide-react'; // شلنا الأيقونات اللي مش مستخدمة
import * as XLSX from 'xlsx';

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
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [optionsCount, setOptionsCount] = useState(4);

  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title_ar: '', title_en: '',
    description_ar: '', description_en: '',
    due_date: '',
    questions: [] as any[],
  });

  // --- Logic ---
  const exportDynamicTemplate = () => {
    const header: any = { question_ar: 'السؤال بالعربي', question_en: 'Question English' };
    for (let i = 1; i <= optionsCount; i++) {
      header[`option_${i}_ar`] = `اختيار ${i} بالعربي`;
      header[`option_${i}_en`] = `Option ${i} English`;
    }
    header['correct_indices'] = '0';
    const ws = XLSX.utils.json_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Luvia_Tasks_${optionsCount}_opts.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportProgress(20);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheet = data.Sheets[data.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];
        setImportProgress(60);
        const imported = rows.map(row => {
          const options = [];
          for (let i = 1; i <= 10; i++) {
            if (row[`option_${i}_ar`]) options.push({ text_ar: row[`option_${i}_ar`], text_en: row[`option_${i}_en`] || '' });
          }
          return {
            question_ar: row.question_ar || '', question_en: row.question_en || '', type: 'single',
            options: options.length > 0 ? options : Array.from({ length: optionsCount }, () => ({ text_ar: '', text_en: '' })),
            correct_answers: row.correct_indices ? row.correct_indices.toString().split(',').map(Number) : [0]
          };
        });
        setFormData(prev => ({ ...prev, questions: [...prev.questions, ...imported] }));
        setImportProgress(100);
        setTimeout(() => {
          setIsImporting(false); setImportProgress(0);
          toast({ title: t('تم', 'Success'), description: t('تم استيراد الأسئلة بنجاح', 'Questions imported successfully') });
        }, 500);
      } catch (err) {
        setIsImporting(false);
        toast({ title: t('خطأ', 'Error'), description: t('فشل قراءة الملف', 'File read failed'), variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const addManualQuestion = () => {
    setFormData({ 
      ...formData, 
      questions: [...formData.questions, {
        question_ar: '', question_en: '', type: 'single',
        options: Array.from({ length: optionsCount }, () => ({ text_ar: '', text_en: '' })),
        correct_answers: [0]
      }] 
    });
  };

  const updateQuestion = (qIdx: number, field: string, val: any) => {
    const updated = [...formData.questions]; updated[qIdx][field] = val;
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, val: string) => {
    const updated = [...formData.questions]; updated[qIdx].options[oIdx][field] = val;
    setFormData({ ...formData, questions: updated });
  };

  const toggleCorrectAnswer = (qIdx: number, oIdx: number) => {
    const updated = [...formData.questions]; updated[qIdx].correct_answers = [oIdx];
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = (qIdx: number) => {
    const updated = [...formData.questions]; updated.splice(qIdx, 1);
    setFormData({ ...formData, questions: updated });
  };

  const resetForm = () => setFormData({ title_ar: '', title_en: '', description_ar: '', description_en: '', due_date: '', questions: [] });

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

  const openResults = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    try {
      setSubmissions(await getAssignmentSubmissions(assignment.id));
      setResultsDialogOpen(true);
    } catch (err: any) { toast({ title: t('خطأ', 'Error'), variant: 'destructive' }); }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourseId) loadLessons(); }, [selectedCourseId]);
  useEffect(() => { if (selectedLessonId) loadAssignments(); }, [selectedLessonId]);

  const loadCourses = async () => { try { setCourses(await getAllCourses(false)); } catch(e) {} };
  const loadLessons = async () => { try { setLessons(await getLessonsByCourse(selectedCourseId)); } catch(e) {} };
  const loadAssignments = async () => { try { setAssignments(await getAssignmentsByLesson(selectedLessonId)); } catch(e) {} };

  return (
    <div className="relative min-h-screen p-4 md:p-8 overflow-hidden text-slate-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Background Glowing Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/5">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest text-blue-500">Task Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">
                {t('نظام الواجبات', 'ASSIGNMENTS')}
              </h1>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
             <div className="group relative w-full md:w-[220px]">
                <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors z-10 rtl:right-4 ltr:left-4 ltr:right-auto" />
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="pl-4 pr-10 rtl:pr-10 rtl:pl-4 bg-white/5 border-white/10 hover:border-blue-500/50 h-14 rounded-2xl transition-all shadow-lg backdrop-blur-md">
                    <SelectValue placeholder={t('اختر الكورس...', 'Select Course...')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0f1e] border-white/10 text-white rounded-2xl">
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{language === 'ar' ? c.title_ar : c.title_en}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <div className="group relative w-full md:w-[220px]">
                <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors z-10 rtl:right-4 ltr:left-4 ltr:right-auto" />
                <Select value={selectedLessonId} onValueChange={setSelectedLessonId} disabled={!selectedCourseId}>
                  <SelectTrigger className="pl-4 pr-10 rtl:pr-10 rtl:pl-4 bg-white/5 border-white/10 hover:border-emerald-500/50 h-14 rounded-2xl transition-all shadow-lg backdrop-blur-md disabled:opacity-50">
                    <SelectValue placeholder={t('اختر الدرس...', 'Select Lesson...')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0f1e] border-white/10 text-white rounded-2xl">
                    {lessons.map(l => <SelectItem key={l.id} value={l.id}>{language === 'ar' ? l.title_ar : l.title_en}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
           </div>
        </div>

        <div className="animate-in slide-in-from-bottom-6 duration-700">
          {!selectedLessonId ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/5 border border-white/5 rounded-[3rem] backdrop-blur-sm shadow-2xl">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                 <LayoutGrid className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t('لم يتم تحديد درس', 'No Lesson Selected')}</h2>
              <p className="text-slate-500 font-medium text-sm">{t('قم باختيار الكورس ثم الدرس لعرض أو إضافة الواجبات', 'Select a course then a lesson')}</p>
            </div>
          ) : (
            <Card className="bg-[#0a0f1e]/80 border-white/10 shadow-2xl rounded-[3rem] backdrop-blur-xl overflow-hidden text-white">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 border-b border-white/5 bg-white/5">
                <div>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Target className="w-6 h-6 text-emerald-400" />
                    {t('واجبات الدرس الحالي', 'Current Lesson Tasks')}
                  </CardTitle>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-8 font-black text-sm shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                      <Plus className="w-5 h-5 mr-2 rtl:ml-2" /> {t('إضافة واجب جديد', 'Create New Task')}
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0f1e] border-white/10 text-white rounded-[2.5rem] p-0 shadow-2xl">
                    <DialogHeader className="bg-gradient-to-r from-blue-900/40 to-emerald-900/20 p-8 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
                      <DialogTitle className="text-3xl font-black italic tracking-tight flex items-center gap-3">
                         <Sparkles className="w-6 h-6 text-blue-400" />
                         {t('تكوين واجب جديد', 'ASSIGNMENT BUILDER')}
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-10 text-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('العنوان (AR)', 'Title AR')}</Label>
                          <Input className="bg-white/5 border-white/10 focus:border-blue-500 h-14 rounded-2xl text-lg font-bold" value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} required />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('العنوان (EN)', 'Title EN')}</Label>
                          <Input className="bg-white/5 border-white/10 focus:border-blue-500 h-14 rounded-2xl text-lg font-bold" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} required />
                        </div>
                      </div>

                      <div className="bg-blue-950/20 border border-blue-500/20 rounded-[2rem] p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                          <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                               <LayoutGrid className="w-5 h-5 text-blue-400" />
                               {t('مولد الأسئلة السريع', 'Quick Question Generator')}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                            <Select value={optionsCount.toString()} onValueChange={v => setOptionsCount(parseInt(v))}>
                              <SelectTrigger className="w-[120px] h-10 bg-white/5 border-none rounded-xl text-xs font-bold text-emerald-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0f1e] border-white/10 text-white rounded-xl">
                                {[2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={n.toString()}>{n} Options</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" size="sm" onClick={exportDynamicTemplate} className="hover:bg-emerald-500/20 text-emerald-400 h-10 px-4 text-xs font-bold">
                              <FileDown className="w-4 h-4 mr-2" /> Template
                            </Button>
                            <div className="relative">
                              <Button type="button" variant="ghost" size="sm" className="bg-blue-500/20 text-blue-400 h-10 px-4 text-xs font-bold transition-all">
                                <FileUp className="w-4 h-4 mr-2" /> Import
                              </Button>
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx" onChange={handleFileUpload} />
                            </div>
                            <Button type="button" size="sm" onClick={addManualQuestion} className="bg-white text-black h-10 px-4 text-xs font-black rounded-xl">
                              <Plus className="w-4 h-4 mr-1" /> Manual
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {formData.questions.map((q, qIdx) => (
                          <div key={qIdx} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 relative group">
                            <div className="flex justify-between items-center mb-6">
                              <div className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">Question {qIdx + 1}</div>
                              <Button type="button" variant="ghost" size="icon" className="text-slate-500 hover:text-red-400" onClick={() => removeQuestion(qIdx)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <Input placeholder={t('نص السؤال (AR)', 'AR')} value={q.question_ar} onChange={e => updateQuestion(qIdx, 'question_ar', e.target.value)} className="bg-black/40 border-white/5 h-12 rounded-xl text-sm" />
                              <Input placeholder={t('نص السؤال (EN)', 'EN')} value={q.question_en} onChange={e => updateQuestion(qIdx, 'question_en', e.target.value)} className="bg-black/40 border-white/5 h-12 rounded-xl text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt: any, oIdx: number) => {
                                const isCorrect = q.correct_answers.includes(oIdx);
                                return (
                                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                                    <button type="button" onClick={() => toggleCorrectAnswer(qIdx, oIdx)}>{isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-600" />}</button>
                                    <div className="flex-1 space-y-2 w-full">
                                      <input className="w-full bg-transparent border-none text-xs text-white focus:outline-none" value={opt.text_ar} onChange={e => updateOption(qIdx, oIdx, 'text_ar', e.target.value)} placeholder="AR" />
                                      <input className="w-full bg-transparent border-none text-xs text-slate-400 focus:outline-none" value={opt.text_en} onChange={e => updateOption(qIdx, oIdx, 'text_en', e.target.value)} placeholder="EN" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="sticky bottom-0 bg-[#0a0f1e] p-6 -mx-8 -mb-8 border-t border-white/5 flex justify-end gap-4 shadow-2xl">
                        <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400">{t('إلغاء', 'Cancel')}</Button>
                        <Button type="submit" className="bg-blue-600 px-12 rounded-xl font-black">{t('حفظ الواجب', 'DEPLOY')}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5 h-16">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8">{t('العنوان', 'Title')}</TableHead>
                      <TableHead className="text-right px-8">{t('النتائج', 'Results')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a.id} className="border-white/5 h-20">
                        <TableCell className="px-8 font-bold text-white">{language === 'ar' ? a.title_ar : a.title_en}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" onClick={() => openResults(a)} className="text-blue-400 bg-blue-500/5 hover:bg-blue-500/20 rounded-xl px-6 h-10 font-bold transition-all">
                            <Eye className="w-4 h-4 mr-2 rtl:ml-2" /> {t('عرض النتائج', 'View Results')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#0a0f1e] border-white/10 text-white rounded-[2.5rem] p-0 shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
              {t('سجل النتائج', 'SUBMISSIONS')}
            </DialogTitle>
            <DialogDescription className="text-blue-400 font-bold mt-2">
              {selectedAssignment && (language === 'ar' ? selectedAssignment.title_ar : selectedAssignment.title_en)}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-none">
                  <TableHead className="py-4 px-6">{t('الطالب', 'Student')}</TableHead>
                  <TableHead>{t('النتيجة', 'Score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id} className="border-white/5">
                    <TableCell className="px-6 font-bold py-4">{s.profiles?.name || 'Unknown'}</TableCell>
                    <TableCell><span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg font-mono font-bold text-xs">{s.score} / {s.total_score}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}