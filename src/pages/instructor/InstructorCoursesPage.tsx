import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import type { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Edit, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, [user]);

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
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('كورساتي', 'My Courses')}</h2>
          <p className="text-muted-foreground">
            {t('إدارة الكورسات والدروس الخاصة بك', 'Manage your courses and lessons')}
          </p>
        </div>
        <Button onClick={() => navigate('/admin')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('إضافة كورس', 'Add Course')}
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {t('لا توجد كورسات', 'No Courses')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('ابدأ بإضافة كورس جديد', 'Start by adding a new course')}
            </p>
            <Button onClick={() => navigate('/admin')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('إضافة كورس', 'Add Course')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('قائمة الكورسات', 'Courses List')}</CardTitle>
            <CardDescription>
              {t('عرض وإدارة جميع كورساتك', 'View and manage all your courses')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('العنوان', 'Title')}</TableHead>
                  <TableHead>{t('السعر', 'Price')}</TableHead>
                  <TableHead>{t('الحالة', 'Status')}</TableHead>
                  <TableHead className="text-center">{t('الإجراءات', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={language === 'ar' ? course.title_ar : course.title_en}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {language === 'ar' ? course.title_ar : course.title_en}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${course.price_usd || 0}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_published ? 'default' : 'secondary'}>
                        {course.is_published
                          ? t('منشور', 'Published')
                          : t('مسودة', 'Draft')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
