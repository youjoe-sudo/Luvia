import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getCourseWithLessons, getCourseProgressForAdmin } from '@/db/api';
import type { Course, Lesson } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, BarChart } from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  email: string;
}

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

export default function InstructorProgressPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [progressData, setProgressData] = useState<LessonProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allCourses = await getAllCourses();
      // تصفية الكورسات للمدرس الحالي أو الكورسات بدون مدرس محدد
      // Filter courses for current instructor or courses without assigned instructor
      const instructorCourses = allCourses.filter(
        (course: any) => course.instructor_id === user.id || course.instructor_id === null
      );
      setCourses(instructorCourses);
      if (instructorCourses.length > 0) {
        setSelectedCourseId(instructorCourses[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseData = async () => {
    if (!selectedCourseId) return;
    setLoadingProgress(true);
    try {
      // تحميل الدروس
      // Load lessons
      const courseData = await getCourseWithLessons(selectedCourseId);
      setLessons(courseData?.lessons || []);

      // تحميل تقدم الطلاب
      // Load student progress
      const progressResult = await getCourseProgressForAdmin(selectedCourseId);
      setStudents(progressResult.students);
      setProgressData(progressResult.progress as any);
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // بناء مصفوفة التقدم
  // Build progress matrix
  const getProgressMatrix = () => {
    const matrix: Record<string, Record<string, { completed: boolean; date: string | null }>> = {};
    
    progressData.forEach((progress) => {
      if (!matrix[progress.user_id]) {
        matrix[progress.user_id] = {};
      }
      matrix[progress.user_id][progress.lesson_id] = {
        completed: progress.is_completed,
        date: progress.completed_at,
      };
    });

    return matrix;
  };

  const progressMatrix = getProgressMatrix();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{t('تقدم الطلاب', 'Student Progress')}</h2>
        <p className="text-muted-foreground">
          {t('متابعة تقدم الطلاب في الدروس', 'Track student progress in lessons')}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {t('لا توجد كورسات', 'No Courses')}
            </h3>
            <p className="text-muted-foreground">
              {t('أضف كورساً أولاً لمتابعة التقدم', 'Add a course first to track progress')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('اختر الكورس', 'Select Course')}</CardTitle>
              <CardDescription>
                {t('اختر كورساً لعرض تقدم الطلاب', 'Select a course to view student progress')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('اختر كورساً', 'Select a course')} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedCourseId && (
            <Card>
              <CardHeader>
                <CardTitle>{t('مصفوفة التقدم', 'Progress Matrix')}</CardTitle>
                <CardDescription>
                  {t('حالة إكمال كل طالب لكل درس', 'Completion status for each student per lesson')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProgress ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('لا يوجد طلاب مسجلين في هذا الكورس', 'No students enrolled in this course')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                        {students.map((student) => {
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
