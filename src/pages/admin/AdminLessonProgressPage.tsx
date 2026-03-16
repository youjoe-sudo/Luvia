import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, getCourseProgressForAdmin } from '@/db/api';
import type { Course, Lesson } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Users, BookOpen, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LessonProgressData {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  lessons: {
    id: string;
    title_ar: string;
    title_en: string;
    course_id: string;
  };
}

interface StudentData {
  id: string;
  name: string;
  email: string;
}

export default function AdminLessonProgressPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [progressData, setProgressData] = useState<LessonProgressData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData();
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700" dir="ltr">
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 p-6 md:p-10">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              {t('متابعة تقدم الطلاب', 'STUDENT PROGRESS')}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {t('مراقبة إنجاز الدروس لكل طالب بشكل حي', 'Real-time monitoring of student lesson completion')}
            </CardDescription>
          </div>

          <div className="w-full md:w-72 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{t('اختر الكورس للمتابعة', 'SELECT COURSE')}</span>
            </div>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus:ring-blue-500">
                <SelectValue placeholder={t('اختر الكورس', 'Select a course')} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="focus:bg-blue-600 focus:text-white">
                    {language === 'ar' ? course.title_ar : course.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!selectedCourseId ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-30">
              <BookOpen className="h-20 w-20 mb-4 text-blue-500" />
              <p className="font-mono text-xs uppercase tracking-[0.2em]">{t('برجاء اختيار كورس أولاً', 'AWAITING_COURSE_SELECTION_')}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Sparkles className="h-8 w-8 text-blue-500 animate-pulse mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest text-blue-400 animate-bounce">{t('جاري مزامنة البيانات...', 'SYNCING_MATRIX...')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              {students.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic font-mono uppercase text-xs">
                  {t('لا يوجد طلاب مسجلين في هذا الكورس بعد', 'No students enrolled in this course yet')}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8 min-w-[200px] sticky left-0 bg-[#0a0f1e] z-10">
                        {t('الطالب', 'STUDENT')}
                      </TableHead>
                      {lessons.map((lesson, index) => (
                        <TableHead key={lesson.id} className="font-black uppercase text-[10px] tracking-widest min-w-[120px] text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-blue-500/50">L{index + 1}</span>
                            <span className="max-w-[100px] truncate" title={language === 'ar' ? lesson.title_ar : lesson.title_en}>
                              {language === 'ar' ? lesson.title_ar : lesson.title_en}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8 text-center min-w-[150px]">
                        {t('نسبة الإنجاز', 'COMPLETION')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentProgress = progressData.filter(p => p.user_id === student.id);
                      const completedCount = studentProgress.filter(p => p.is_completed).length;
                      const completionPercentage = lessons.length > 0 
                        ? Math.round((completedCount / lessons.length) * 100) 
                        : 0;

                      return (
                        <TableRow key={student.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="py-6 px-8 sticky left-0 bg-[#0a0f1e]/90 backdrop-blur-md z-10 group-hover:text-blue-400 transition-colors">
                            <div className="font-bold text-white">{student.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">{student.email}</div>
                          </TableCell>
                          
                          {lessons.map((lesson) => {
                            const progress = studentProgress.find(p => p.lesson_id === lesson.id);
                            const isDone = progress?.is_completed;
                            
                            return (
                              <TableCell key={lesson.id} className="text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {isDone ? (
                                    <div className="relative">
                                      <CheckCircle className="h-6 w-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                      <div className="absolute -inset-1 bg-emerald-500/20 blur-lg rounded-full animate-pulse"></div>
                                    </div>
                                  ) : (
                                    <XCircle className="h-5 w-5 text-slate-800" />
                                  )}
                                  
                                  {isDone && progress?.completed_at && (
                                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                                      {new Date(progress.completed_at).toLocaleDateString(
                                        language === 'ar' ? 'ar-EG' : 'en-US',
                                        { month: 'short', day: 'numeric' }
                                      )}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}

                          <TableCell className="text-center px-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className={`h-full transition-all duration-1000 ${completionPercentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                              <Badge className={`
                                text-[10px] font-black font-mono border-none
                                ${completionPercentage === 100 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : completionPercentage > 0 
                                    ? 'bg-blue-500/10 text-blue-400' 
                                    : 'bg-slate-800 text-slate-500'}
                              `}>
                                {completedCount} / {lessons.length} ({completionPercentage}%)
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="flex items-center gap-6 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl w-fit mx-auto">
         <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('مكتمل', 'COMPLETED')}</span>
         </div>
         <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-slate-700" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('غير مكتمل', 'INCOMPLETE')}</span>
         </div>
      </div>
    </div>
  );
}