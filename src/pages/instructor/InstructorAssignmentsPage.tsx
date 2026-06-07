import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, getCourseWithLessons } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Course, Lesson } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Assignment {
  id: string;
  course_id: string;
  lesson_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  due_date: string | null;
  created_at: string;
  lessons: {
    id: string;
    title_ar: string;
    title_en: string;
  };
}

export default function InstructorAssignmentsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      loadAssignments();
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

  const loadAssignments = async () => {
    if (!selectedCourseId) return;
    setLoadingAssignments(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          lessons!assignments_lesson_id_fkey(id, title_ar, title_en)
        `)
        .eq('course_id', selectedCourseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data as any || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentToDelete);

      if (error) throw error;

      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الواجب بنجاح', 'Assignment deleted successfully'),
      });

      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حذف الواجب', 'Failed to delete assignment'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
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
          <h2 className="text-2xl font-bold">{t('الواجبات', 'Assignments')}</h2>
          <p className="text-muted-foreground">
            {t('إدارة الواجبات ومتابعة النتائج', 'Manage assignments and track results')}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('إضافة واجب', 'Add Assignment')}
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {t('لا توجد كورسات', 'No Courses')}
            </h3>
            <p className="text-muted-foreground">
              {t('أضف كورساً أولاً لإنشاء الواجبات', 'Add a course first to create assignments')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('اختر الكورس', 'Select Course')}</CardTitle>
              <CardDescription>
                {t('اختر كورساً لعرض الواجبات', 'Select a course to view assignments')}
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
                <CardTitle>{t('قائمة الواجبات', 'Assignments List')}</CardTitle>
                <CardDescription>
                  {t('جميع الواجبات في الكورس', 'All assignments in the course')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssignments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      {t('لا توجد واجبات في هذا الكورس', 'No assignments in this course')}
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('إضافة واجب', 'Add Assignment')}
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('العنوان', 'Title')}</TableHead>
                        <TableHead>{t('الدرس', 'Lesson')}</TableHead>
                        <TableHead>{t('تاريخ التسليم', 'Due Date')}</TableHead>
                        <TableHead className="text-center">{t('الإجراءات', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {language === 'ar' ? assignment.title_ar : assignment.title_en}
                          </TableCell>
                          <TableCell>
                            {language === 'ar' 
                              ? assignment.lessons.title_ar 
                              : assignment.lessons.title_en}
                          </TableCell>
                          <TableCell>
                            {assignment.due_date ? (
                              new Date(assignment.due_date).toLocaleDateString(
                                language === 'ar' ? 'ar-EG' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )
                            ) : (
                              <Badge variant="secondary">{t('بدون موعد', 'No deadline')}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAssignmentToDelete(assignment.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('تأكيد الحذف', 'Confirm Deletion')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'هل أنت متأكد من حذف هذا الواجب؟ لا يمكن التراجع عن هذا الإجراء.',
                'Are you sure you want to delete this assignment? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment}>
              {t('حذف', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
