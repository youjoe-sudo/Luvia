import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface EnrolledStudent {
  user_id: string;
  enrolled_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InstructorStudentsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudents();
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

  const loadStudents = async () => {
    if (!selectedCourseId) return;
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          user_id,
          enrolled_at,
          profiles!user_courses_user_id_fkey(id, name, email)
        `)
        .eq('course_id', selectedCourseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setStudents(data as any || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

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
        <h2 className="text-2xl font-bold">{t('الطلاب', 'Students')}</h2>
        <p className="text-muted-foreground">
          {t('عرض الطلاب المسجلين في كورساتك', 'View students enrolled in your courses')}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {t('لا توجد كورسات', 'No Courses')}
            </h3>
            <p className="text-muted-foreground">
              {t('أضف كورساً أولاً لرؤية الطلاب', 'Add a course first to see students')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('اختر الكورس', 'Select Course')}</CardTitle>
              <CardDescription>
                {t('اختر كورساً لعرض الطلاب المسجلين', 'Select a course to view enrolled students')}
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
                <CardTitle>{t('قائمة الطلاب', 'Students List')}</CardTitle>
                <CardDescription>
                  {t('الطلاب المسجلين في الكورس', 'Students enrolled in the course')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('#', '#')}</TableHead>
                        <TableHead>{t('الاسم', 'Name')}</TableHead>
                        <TableHead>{t('البريد الإلكتروني', 'Email')}</TableHead>
                        <TableHead>{t('تاريخ التسجيل', 'Enrollment Date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={student.user_id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {student.profiles.name}
                          </TableCell>
                          <TableCell>{student.profiles.email}</TableCell>
                          <TableCell>
                            {new Date(student.enrolled_at).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US',
                              { year: 'numeric', month: 'long', day: 'numeric' }
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
