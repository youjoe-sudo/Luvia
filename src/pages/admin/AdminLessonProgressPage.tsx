import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getLessonsByCourse, getCourseProgressForAdmin } from '@/db/api';
import type { Course, Lesson } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
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
      loadLessons();
      loadProgress();
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

  const loadLessons = async () => {
    if (!selectedCourseId) return;
    try {
      const data = await getLessonsByCourse(selectedCourseId);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadProgress = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const data = await getCourseProgressForAdmin(selectedCourseId);
      setStudents(data.students);
      setProgressData(data.progress as any);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // تجميع البيانات حسب الطالب والدرس
  // Group data by student and lesson
  const getProgressMatrix = () => {
    const matrix: Record<string, Record<string, { completed: boolean; date: string | null }>> = {};
    
    progressData.forEach((progress) => {
      const studentId = progress.user_id;
      const lessonId = progress.lesson_id;
      
      if (!matrix[studentId]) {
        matrix[studentId] = {};
      }
      
      matrix[studentId][lessonId] = {
        completed: progress.is_completed,
        date: progress.completed_at,
      };
    });
    
    return matrix;
  };

  // الحصول على قائمة الطلاب الفريدة
  // Get unique students list
  const getUniqueStudents = () => {
    return students;
  };

  const progressMatrix = getProgressMatrix();
  const displayStudents = getUniqueStudents();

  return (
    <div className="container mx-auto p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {t('تتبع إكمال الدروس', 'Lesson Completion Tracking')}
          </CardTitle>
          <CardDescription>
            {t('عرض تقدم الطلاب في إكمال دروس الكورسات', 'View student progress in completing course lessons')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اختيار الكورس */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('اختر الكورس', 'Select Course')}
            </label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder={t('اختر كورس', 'Select a course')} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {language === 'ar' ? course.title_ar : course.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* جدول التقدم */}
          {selectedCourseId && (
            <div className="border rounded-lg overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t('جاري التحميل...', 'Loading...')}
                </div>
              ) : displayStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t('لا يوجد طلاب مسجلين في هذا الكورس', 'No students enrolled in this course')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        {t('الطالب', 'Student')}
                      </TableHead>
                      {lessons.map((lesson) => (
                        <TableHead key={lesson.id} className="text-center min-w-[150px]">
                          {language === 'ar' ? lesson.title_ar : lesson.title_en}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">
                        {t('الإجمالي', 'Total')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStudents.map((student) => {
                      const studentProgress = progressMatrix[student.id] || {};
                      const completedCount = lessons.filter(
                        (lesson) => studentProgress[lesson.id]?.completed
                      ).length;
                      const completionPercentage = lessons.length > 0
                        ? Math.round((completedCount / lessons.length) * 100)
                        : 0;

                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </TableCell>
                          {lessons.map((lesson) => {
                            const progress = studentProgress[lesson.id];
                            return (
                              <TableCell key={lesson.id} className="text-center">
                                {progress?.completed ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    {progress.date && (
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(progress.date).toLocaleDateString(
                                          language === 'ar' ? 'ar-EG' : 'en-US',
                                          { month: 'short', day: 'numeric' }
                                        )}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
                              {completedCount} / {lessons.length} ({completionPercentage}%)
                            </Badge>
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
    </div>
  );
}
