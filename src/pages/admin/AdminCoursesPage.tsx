import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '@/db/api';
import type { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    instructor_name_ar: '',
    instructor_name_en: '',
    price_usd: '',
    thumbnail_url: '',
    whatsapp_number: '',
    is_published: false,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses(false); // Get all courses including unpublished
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل الكورسات', 'Failed to load courses'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title_ar: course.title_ar,
        title_en: course.title_en,
        description_ar: course.description_ar || '',
        description_en: course.description_en || '',
        instructor_name_ar: course.instructor_name_ar || '',
        instructor_name_en: course.instructor_name_en || '',
        price_usd: course.price_usd?.toString() || '',
        thumbnail_url: course.thumbnail_url || '',
        whatsapp_number: course.whatsapp_number || '',
        is_published: course.is_published,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        instructor_name_ar: '',
        instructor_name_en: '',
        price_usd: '',
        thumbnail_url: '',
        whatsapp_number: '',
        is_published: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title_ar || !formData.title_en) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب إدخال عنوان الكورس بالعربية والإنجليزية', 'Course title in both languages is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const courseData = {
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        description_ar: formData.description_ar || null,
        description_en: formData.description_en || null,
        instructor_name_ar: formData.instructor_name_ar || null,
        instructor_name_en: formData.instructor_name_en || null,
        price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
        thumbnail_url: formData.thumbnail_url || null,
        whatsapp_number: formData.whatsapp_number || null,
        is_published: formData.is_published,
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        toast({
          title: t('تم التحديث', 'Updated'),
          description: t('تم تحديث الكورس بنجاح', 'Course updated successfully'),
        });
      } else {
        await createCourse(courseData as any);
        toast({
          title: t('تم الإنشاء', 'Created'),
          description: t('تم إنشاء الكورس بنجاح', 'Course created successfully'),
        });
      }

      setDialogOpen(false);
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حفظ الكورس', 'Failed to save course'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الكورس بنجاح', 'Course deleted successfully'),
      });
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حذف الكورس', 'Failed to delete course'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('إدارة الكورسات', 'Course Management')}</CardTitle>
              <CardDescription>
                {t('إضافة وتعديل وحذف الكورسات', 'Add, edit, and delete courses')}
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('إضافة كورس', 'Add Course')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? t('تعديل الكورس', 'Edit Course') : t('إضافة كورس جديد', 'Add New Course')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('أدخل بيانات الكورس بالعربية والإنجليزية', 'Enter course details in Arabic and English')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_ar">{t('عنوان الكورس (عربي)', 'Course Title (Arabic)')} *</Label>
                      <Input
                        id="title_ar"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title_en">{t('عنوان الكورس (إنجليزي)', 'Course Title (English)')} *</Label>
                      <Input
                        id="title_en"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description_ar">{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
                      <Textarea
                        id="description_ar"
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description_en">{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
                      <Textarea
                        id="description_en"
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructor_ar">{t('اسم المحاضر (عربي)', 'Instructor Name (Arabic)')}</Label>
                      <Input
                        id="instructor_ar"
                        value={formData.instructor_name_ar}
                        onChange={(e) => setFormData({ ...formData, instructor_name_ar: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructor_en">{t('اسم المحاضر (إنجليزي)', 'Instructor Name (English)')}</Label>
                      <Input
                        id="instructor_en"
                        value={formData.instructor_name_en}
                        onChange={(e) => setFormData({ ...formData, instructor_name_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('السعر (دولار)', 'Price (USD)')}</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price_usd}
                        onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">{t('رقم الواتساب', 'WhatsApp Number')}</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                        placeholder="+966501234567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">{t('رابط الصورة المصغرة', 'Thumbnail URL')}</Label>
                    <Input
                      id="thumbnail"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="published">{t('نشر الكورس', 'Publish Course')}</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t('إلغاء', 'Cancel')}
                    </Button>
                    <Button type="submit">
                      {editingCourse ? t('تحديث', 'Update') : t('إنشاء', 'Create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('جاري التحميل...', 'Loading...')}</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t('لا توجد كورسات', 'No courses yet')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('العنوان', 'Title')}</TableHead>
                  <TableHead>{t('المحاضر', 'Instructor')}</TableHead>
                  <TableHead>{t('السعر', 'Price')}</TableHead>
                  <TableHead>{t('الحالة', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </TableCell>
                    <TableCell>
                      {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                    </TableCell>
                    <TableCell>{course.price_usd ? `$${course.price_usd}` : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${course.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {course.is_published ? t('منشور', 'Published') : t('مسودة', 'Draft')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Deletion')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('هل أنت متأكد من حذف هذا الكورس؟ هذا الإجراء لا يمكن التراجع عنه.', 'Are you sure you want to delete this course? This action cannot be undone.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(course.id)}>
                                {t('حذف', 'Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
