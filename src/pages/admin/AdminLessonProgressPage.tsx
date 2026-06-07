import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, getCourseProgressForAdmin } from '@/db/api';
import type { Course, Lesson } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, BookOpen, Search, Sparkles, Download, ListChecks, Users, BarChart3, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

export default function AdminLessonProgressPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [progressData, setProgressData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'struggling'>('all');
  const { t, language } = useLanguage();

  useEffect(() => { loadCourses(); }, []);
  
  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData();
      setSelectedLessonIds([]);
      setSearchQuery('');
      setFilterType('all');
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses(false);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const lessonsData = await getLessonsByCourse(selectedCourseId);
      setLessons(lessonsData);
      const { progress, students: studentsData } = await getCourseProgressForAdmin(selectedCourseId);
      setProgressData(progress as any);
      setStudents(studentsData as any);
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (students.length === 0) return { avg: 0, total: 0, struggling: 0 };
    const totalCompletion = students.reduce((acc, s) => {
      const count = progressData.filter(p => p.user_id === s.id && p.is_completed).length;
      return acc + (count / (lessons.length || 1));
    }, 0);
    const strugglingList = students.filter(s => !progressData.some(p => p.user_id === s.id && p.is_completed));
    return {
      avg: Math.round((totalCompletion / students.length) * 100),
      total: students.length,
      struggling: strugglingList.length
    };
  }, [students, progressData, lessons]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterType === 'struggling') {
      list = list.filter(s => !progressData.some(p => p.user_id === s.id && p.is_completed));
    }
    return list.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery, filterType, progressData]);

  const displayedLessons = useMemo(() => 
    selectedLessonIds.length === 0 ? lessons : lessons.filter(l => selectedLessonIds.includes(l.id))
  , [lessons, selectedLessonIds]);

  const handleExportExcel = () => {
    const data = students.map(s => {
      const row: any = { 'Student': s.name, 'Email': s.email };
      lessons.forEach((l, i) => {
        const isDone = progressData.find(p => p.user_id === s.id && p.lesson_id === l.id)?.is_completed;
        row[`L${i+1}: ${language === 'ar' ? l.title_ar : l.title_en}`] = isDone ? 'Done ✅' : 'No ❌';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progress");
    XLSX.writeFile(wb, `Students_Progress_${selectedCourseId}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20" dir="ltr">
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 md:p-10 border-b border-white/5">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic flex items-center gap-3">
              <ListChecks className="w-8 h-8 text-blue-500" /> 
              {t('متابعة تقدم الطلاب', 'STUDENT MATRIX')}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {selectedCourseId ? `${t('مراقبة', 'Monitoring')} ${students.length} ${t('طالب', 'students')}` : t('اختر الكورس للبدء', 'Select a course to begin')}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {selectedCourseId && (
              <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 px-6 py-3 rounded-xl transition-all font-bold text-xs group">
                <Download className="w-4 h-4" /> {t('تحميل', 'EXPORT')}
              </button>
            )}
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-white/5 border-white/10 h-12 w-full sm:w-64 rounded-xl text-white outline-none">
                <SelectValue placeholder={t('اختر الكورس', 'Select Course')} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {language === 'ar' ? c.title_ar : c.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {selectedCourseId && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 md:px-10 bg-white/[0.01]">
            <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-white/5 space-y-2">
              <BarChart3 className="text-blue-500 w-5 h-5" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('متوسط الإنجاز', 'Global Progress')}</p>
              <p className="text-3xl font-black text-white">{stats.avg}%</p>
            </div>
            
            <div 
              onClick={() => setFilterType('all')}
              className={`p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${filterType === 'all' ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 hover:border-emerald-500/50'}`}
            >
              <Users className={`w-5 h-5 mb-2 ${filterType === 'all' ? 'text-white' : 'text-emerald-500'}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${filterType === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>{t('إجمالي الطلاب', 'Total Students')}</p>
              <p className="text-3xl font-black text-white">{stats.total}</p>
            </div>

            <div 
              onClick={() => setFilterType('struggling')}
              className={`p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${filterType === 'struggling' ? 'bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5 hover:border-red-500/50'}`}
            >
              <AlertCircle className={`w-5 h-5 mb-2 ${filterType === 'struggling' ? 'text-white' : 'text-red-500'}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${filterType === 'struggling' ? 'text-red-100' : 'text-slate-500'}`}>{t('طلاب لم يبدأوا', 'Struggling (0%)')}</p>
              <p className="text-3xl font-black text-white">{stats.struggling}</p>
            </div>
          </div>
        )}

        {selectedCourseId && !loading && (
          <div className="p-6 md:px-10 border-t border-white/5 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder={t('بحث عن طالب...', 'Find student by name or email...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/5 border-white/5 h-12 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={() => setSelectedLessonIds([])} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${selectedLessonIds.length === 0 ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}>
                {t('الكل', 'ALL LESSONS')}
              </button>
              {lessons.map((l, i) => (
                <button key={l.id} onClick={() => setSelectedLessonIds(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id])} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all whitespace-nowrap ${selectedLessonIds.includes(l.id) ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-blue-500/30'}`}>
                  S{i+1}
                </button>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {!selectedCourseId ? (
             <div className="flex flex-col items-center justify-center py-40 opacity-10"><BookOpen className="h-24 w-24 mb-4" /><p className="font-mono text-xs uppercase tracking-[0.4em]">Initialize Connection...</p></div>
          ) : loading ? (
             <div className="flex flex-col items-center justify-center py-40"><Sparkles className="h-10 w-10 text-blue-500 animate-spin mb-4" /><p className="font-mono text-xs uppercase tracking-widest text-blue-400">Fetching Data Stream...</p></div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-6 px-8 min-w-[240px] sticky left-0 bg-[#0a0f1e] z-30 font-black text-[10px] tracking-widest border-r border-white/5 shadow-xl">{t('الطالب', 'STUDENT DETAILS')}</TableHead>
                    {displayedLessons.map((l) => (
                      <TableHead key={l.id} className="text-center font-black text-[10px] min-w-[120px] uppercase">
                        <span className="text-blue-500/40 block mb-1">S{lessons.findIndex(x => x.id === l.id) + 1}</span>
                        <span className="truncate block w-24 mx-auto text-slate-400">{language === 'ar' ? l.title_ar : l.title_en}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[160px] font-black text-[10px] border-l border-white/5">{t('نسبة الإنجاز', 'COMPLETION')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={99} className="py-20 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">No matching records found</TableCell></TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const sProgress = progressData.filter(p => p.user_id === student.id);
                      const doneCount = sProgress.filter(p => p.is_completed).length;
                      const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;

                      return (
                        <TableRow key={student.id} className="border-white/5 hover:bg-blue-500/[0.02] group transition-all">
                          <TableCell className="py-6 px-8 sticky left-0 bg-[#0a0f1e]/95 backdrop-blur-md z-20 border-r border-white/5">
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{student.name}</div>
                            <div className="text-[9px] text-slate-500 font-mono truncate">{student.email}</div>
                          </TableCell>
                          {displayedLessons.map((l) => {
                            const prog = sProgress.find(p => p.lesson_id === l.id);
                            return (
                              <TableCell key={l.id} className="text-center">
                                {prog?.is_completed ? (
                                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                    <CheckCircle className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                    <span className="text-[8px] text-slate-600 mt-1 font-mono">{new Date(prog.completed_at!).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {day:'2-digit', month:'short'})}</span>
                                  </div>
                                ) : <XCircle className="h-5 w-5 text-slate-800" />}
                              </TableCell>
                            );
                          })}
                          <TableCell className="px-8 border-l border-white/5">
                            <div className="flex flex-col gap-2">
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <Badge className={`text-[9px] font-black w-fit mx-auto ${pct === 100 ? 'bg-emerald-500/10 text-emerald-500' : pct > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                {doneCount}/{lessons.length} ({pct}%)
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}