import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getAllCourses, 
  getLessonsByCourse, 
  createAssignment, 
  updateAssignment, // تأكد أن هذه الدالة موجودة في api.ts
  deleteAssignment, // تأكد أن هذه الدالة موجودة في api.ts
  getAssignmentsByLesson, 
  getAssignmentSubmissions 
} from '@/db/api';
import type { Course, Lesson, Assignment, AssignmentSubmission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, Eye, FileUp, FileDown, Edit,
  LayoutGrid, Sparkles, BookOpen, Layers, Target, CheckCircle2, Circle
} from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [optionsCount, setOptionsCount] = useState(4);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title_ar: '', title_en: '',
    description_ar: '', description_en: '',
    due_date: '',
    questions: [] as any[],
  });

  // --- Functions ---
  const loadCourses = async () => { try { setCourses(await getAllCourses(false)); } catch(e) {} };
  const loadLessons = async () => { try { setLessons(await getLessonsByCourse(selectedCourseId)); } catch(e) {} };
  const loadAssignments = async () => { try { setAssignments(await getAssignmentsByLesson(selectedLessonId)); } catch(e) {} };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourseId) loadLessons(); }, [selectedCourseId]);
  useEffect(() => { if (selectedLessonId) loadAssignments(); }, [selectedLessonId]);

  const resetForm = () => {
    setFormData({ title_ar: '', title_en: '', description_ar: '', description_en: '', due_date: '', questions: [] });
    setEditingId(null);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setFormData({
      title_ar: assignment.title_ar,
      title_en: assignment.title_en,
      description_ar: assignment.description_ar || '',
      description_en: assignment.description_en || '',
      due_date: assignment.due_date || '',
      questions: (assignment.questions as any[]) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('هل أنت متأكد من حذف هذا الواجب؟', 'Are you sure you want to delete this assignment?'))) return;
    try {
      await deleteAssignment(id);
      toast({ title: t('تم الحذف', 'Deleted'), description: t('تم حذف الواجب بنجاح', 'Assignment deleted successfully') });
      loadAssignments();
    } catch (err: any) {
      toast({ title: t('خطأ', 'Error'), description: err.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.questions.length === 0) {
      toast({ title: t('تنبيه', 'Alert'), description: t('يجب إضافة سؤال واحد على الأقل', 'Add at least one question'), variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        ...formData,
        course_id: selectedCourseId,
        lesson_id: selectedLessonId,
        description_ar: formData.description_ar || null,
        description_en: formData.description_en || null,
        due_date: formData.due_date || null
      };

      if (editingId) {
        await updateAssignment(editingId, payload as any);
      } else {
        await createAssignment(payload as any);
      }

      toast({ title: t('تم', 'Success'), description: editingId ? t('تم التعديل بنجاح', 'Updated') : t('تم الحفظ بنجاح', 'Saved') });
      setDialogOpen(false);
      loadAssignments();
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: 'destructive' });
    }
  };

  const openResults = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    try {
      const data = await getAssignmentSubmissions(assignment.id);
      setSubmissions(data);
      setResultsDialogOpen(true);
    } catch (err: any) { toast({ title: "Error", variant: 'destructive' }); }
  };

  // --- Question Helpers ---
  const addManualQuestion = () => {
    setFormData({ ...formData, questions: [...formData.questions, { question_ar: '', question_en: '', type: 'single', options: Array.from({ length: optionsCount }, () => ({ text_ar: '', text_en: '' })), correct_answers: [0] }] });
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

  const exportTemplate = () => {
    const header: any = { question_ar: 'السؤال بالعربي', question_en: 'Question English' };
    for (let i = 1; i <= optionsCount; i++) {
      header[`option_${i}_ar`] = `اختيار ${i} بالعربي`;
      header[`option_${i}_en`] = `Option ${i} English`;
    }
    header['correct_indices'] = '0';
    const ws = XLSX.utils.json_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Luvia_Template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = XLSX.read(evt.target?.result, { type: 'binary' });
        const rows = XLSX.utils.sheet_to_json(data.Sheets[data.SheetNames[0]]) as any[];
        const imported = rows.map(row => {
          const options = [];
          for (let i = 1; i <= 10; i++) {
            if (row[`option_${i}_ar`]) options.push({ text_ar: row[`option_${i}_ar`], text_en: row[`option_${i}_en`] || '' });
          }
          return {
            question_ar: row.question_ar || '', question_en: row.question_en || '', type: 'single',
            options: options.length > 0 ? options : Array.from({ length: optionsCount }, () => ({ text_ar: '', text_en: '' })),
            correct_answers: row.correct_indices != null ? row.correct_indices.toString().split(',').map(Number) : [0]
          };
        });
        setFormData(prev => ({ ...prev, questions: [...prev.questions, ...imported] }));
      } catch (err) { toast({ title: "Error", description: "Excel format error", variant: "destructive" }); }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="relative min-h-screen p-4 md:p-8 bg-[#020617] text-slate-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
           <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-blue-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Luvia Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter">{t('الواجبات والمهام', 'ASSIGNMENTS')}</h1>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full md:w-[220px] bg-white/5 border-white/10 h-14 rounded-2xl">
                  <SelectValue placeholder={t('اختر الكورس', 'Select Course')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{language === 'ar' ? c.title_ar : c.title_en}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedLessonId} onValueChange={setSelectedLessonId} disabled={!selectedCourseId}>
                <SelectTrigger className="w-full md:w-[220px] bg-white/5 border-white/10 h-14 rounded-2xl">
                  <SelectValue placeholder={t('اختر الدرس', 'Select Lesson')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {lessons.map(l => <SelectItem key={l.id} value={l.id}>{language === 'ar' ? l.title_ar : l.title_en}</SelectItem>)}
                </SelectContent>
              </Select>
           </div>
        </div>

        {/* Main Card */}
        {!selectedLessonId ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
             <LayoutGrid className="w-16 h-16 text-slate-800 mb-4" />
             <p className="text-slate-600 font-bold">{t('قم باختيار الدرس لإدارة الواجبات', 'Select a lesson to manage assignments')}</p>
          </div>
        ) : (
          <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-emerald-400" /> {t('واجبات الدرس الحالي', 'Lesson Tasks')}
              </CardTitle>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 font-bold shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> {t('إضافة واجب', 'New Assignment')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 h-14">
                    <TableHead className="px-8">{t('عنوان الواجب', 'Assignment Title')}</TableHead>
                    <TableHead className="text-right px-8">{t('الإجراءات', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center py-20 text-slate-600 italic">{t('لا توجد واجبات مضافة', 'No assignments added yet')}</TableCell></TableRow>
                  ) : (
                    assignments.map(a => (
                      <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.01] h-20">
                        <TableCell className="px-8 font-bold text-slate-200">{language === 'ar' ? a.title_ar : a.title_en}</TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => openResults(a)} className="text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl px-4 font-bold">
                              <Eye className="w-4 h-4 mr-2 rtl:ml-2" /> {t('النتائج', 'Results')}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(a)} className="text-emerald-400 hover:bg-emerald-500/10 rounded-xl">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-red-400 hover:bg-red-500/10 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Builder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#020617] border-white/10 text-white rounded-[2rem] p-0 custom-scrollbar">
          <DialogHeader className="p-8 border-b border-white/5 sticky top-0 bg-[#020617] z-30">
            <DialogTitle className="text-2xl font-black">{editingId ? t('تعديل الواجب', 'EDIT ASSIGNMENT') : t('بناء واجب جديد', 'CREATE ASSIGNMENT')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">{t('العنوان بالعربي', 'Title AR')}</Label>
                <Input className="bg-white/5 border-white/10 h-12 rounded-xl" value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">{t('العنوان بالانجليزي', 'Title EN')}</Label>
                <Input className="bg-white/5 border-white/10 h-12 rounded-xl" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} required />
              </div>
            </div>

            <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <Select value={optionsCount.toString()} onValueChange={v => setOptionsCount(parseInt(v))}>
                    <SelectTrigger className="w-[140px] bg-black/40 border-white/10 h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {[2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} {t('اختيارات', 'Options')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={exportTemplate} className="border-white/10 h-10"><FileDown className="w-4 h-4 mr-2" /> Template</Button>
               </div>
               <div className="flex items-center gap-2">
                 <div className="relative">
                   <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-500 h-10"><FileUp className="w-4 h-4 mr-2" /> Import</Button>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx" onChange={handleFileUpload} />
                 </div>
                 <Button type="button" size="sm" onClick={addManualQuestion} className="bg-white text-black h-10 font-bold"><Plus className="w-4 h-4 mr-1" /> Manual</Button>
               </div>
            </div>

            <div className="space-y-4">
              {formData.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative group">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase tracking-wider">Question {qIdx + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIdx)} className="text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input placeholder="نص السؤال (AR)" value={q.question_ar} onChange={e => updateQuestion(qIdx, 'question_ar', e.target.value)} className="bg-black/20 border-white/5 h-11" />
                      <Input placeholder="Question (EN)" value={q.question_en} onChange={e => updateQuestion(qIdx, 'question_en', e.target.value)} className="bg-black/20 border-white/5 h-11" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: any, oIdx: number) => {
                        const isCorrect = q.correct_answers.includes(oIdx);
                        return (
                          <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/20 border-white/5'}`}>
                            <button type="button" onClick={() => toggleCorrectAnswer(qIdx, oIdx)}>
                              {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-600" />}
                            </button>
                            <div className="flex-1">
                              <input className="w-full bg-transparent border-none text-[11px] text-white focus:outline-none mb-1" value={opt.text_ar} onChange={e => updateOption(qIdx, oIdx, 'text_ar', e.target.value)} placeholder="AR" />
                              <input className="w-full bg-transparent border-none text-[11px] text-slate-400 focus:outline-none" value={opt.text_en} onChange={e => updateOption(qIdx, oIdx, 'text_en', e.target.value)} placeholder="EN" />
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-[#020617] p-6 -mx-8 -mb-8 border-t border-white/5 flex justify-end gap-3 z-30">
               <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400">{t('إلغاء', 'Cancel')}</Button>
               <Button type="submit" className="bg-blue-600 px-10 h-12 font-black rounded-xl">{editingId ? t('تحديث الواجب', 'UPDATE') : t('حفظ الواجب', 'DEPLOY')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#020617] border-white/10 text-white rounded-[2rem] p-0 shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-black italic uppercase">{t('سجل التسليمات', 'SUBMISSIONS')}</DialogTitle>
            <DialogDescription className="text-blue-400 font-bold mt-1">
              {selectedAssignment && (language === 'ar' ? selectedAssignment.title_ar : selectedAssignment.title_en)}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-none">
                  <TableHead className="px-6">{t('اسم الطالب', 'Student Name')}</TableHead>
                  <TableHead className="text-center">{t('الدرجة', 'Score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <Target className="w-10 h-10 text-slate-600" />
                        <p className="text-slate-500 font-bold">{t('لا يوجد طلاب قاموا بالحل حتى الآن', 'No students submitted yet')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((s) => (
                    <TableRow key={s.id} className="border-white/5">
                      <TableCell className="px-6 font-bold py-4">{s.profiles?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-lg font-mono font-bold text-xs border border-emerald-500/20">
                          {s.score} / {s.total_score}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}