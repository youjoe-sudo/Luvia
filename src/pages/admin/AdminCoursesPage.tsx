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
import { Plus, Edit, Trash2, BookOpen, Sparkles, Layers, DollarSign, Image as ImageIcon, MessageCircle } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500" dir="ltr">
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 p-6 md:p-8">
          <div>
            <CardTitle className="text-2xl font-black italic flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              {t('إدارة الكورسات', 'COURSE MANAGEMENT')}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {t('إضافة وتعديل وحذف الكورسات التعليمية', 'Add, edit, and delete educational courses')}
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-blue-900/20">
                <Plus className="w-4 h-4 mr-2" />
                {t('إضافة كورس', 'Add Course')}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0f1e] border-white/10 text-white rounded-[2rem] p-4 md:p-10 custom-scrollbar">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase">
                  <Layers className="w-6 h-6 text-blue-500" />
                  {editingCourse ? t('تعديل الكورس', 'EDIT COURSE') : t('إضافة كورس جديد', 'NEW COURSE')}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  {t('أدخل بيانات الكورس بالعربية والإنجليزية', 'Enter course details in Arabic and English')}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('عنوان الكورس (عربي)', 'Title (AR)')} *</Label>
                    <Input
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('عنوان الكورس (إنجليزي)', 'Title (EN)')} *</Label>
                    <Input
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (عربي)', 'Description (AR)')}</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 rounded-xl resize-none"
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (إنجليزي)', 'Description (EN)')}</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 rounded-xl resize-none"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Instructors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('اسم المحاضر (عربي)', 'Instructor (AR)')}</Label>
                    <Input
                      className="bg-[#0a0f1e] border-white/10 h-11 rounded-xl"
                      value={formData.instructor_name_ar}
                      onChange={(e) => setFormData({ ...formData, instructor_name_ar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('اسم المحاضر (إنجليزي)', 'Instructor (EN)')}</Label>
                    <Input
                      className="bg-[#0a0f1e] border-white/10 h-11 rounded-xl"
                      value={formData.instructor_name_en}
                      onChange={(e) => setFormData({ ...formData, instructor_name_en: e.target.value })}
                    />
                  </div>
                </div>

                {/* Price & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><DollarSign className="w-3 h-3"/> {t('السعر (دولار)', 'Price (USD)')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-white/5 border-white/10 h-12 rounded-xl text-emerald-400 font-bold"
                      value={formData.price_usd}
                      onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><MessageCircle className="w-3 h-3"/> {t('رقم الواتساب', 'WhatsApp Number')}</Label>
                    <Input
                      className="bg-white/5 border-white/10 h-12 rounded-xl font-mono"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder="+201xxxxxxxxx"
                    />
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {t('رابط الصورة المصغرة', 'Thumbnail URL')}</Label>
                  <Input
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-blue-300 font-mono text-xs"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.thumbnail_url && (
                    <div className="mt-2 h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                       <img src={formData.thumbnail_url} alt="Preview" className="h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>

                {/* Publish Switch */}
                <div className="flex items-center space-x-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="published" className="font-bold text-blue-100 cursor-pointer">
                    {t('نشر الكورس وجعله متاحاً للطلاب', 'Publish course and make it visible')}
                  </Label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="hover:bg-white/5">
                    {t('إلغاء', 'Cancel')}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 rounded-xl font-bold">
                    {editingCourse ? t('تحديث البيانات', 'Update Course') : t('إنشاء الكورس', 'Create Course')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Sparkles className="h-8 w-8 text-blue-500 animate-pulse mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">{t('جاري التحميل...', 'LOADING MATRIX...')}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20 text-blue-500" />
              <p className="font-mono text-xs uppercase tracking-widest">{t('لا توجد كورسات', 'NO COURSES YET')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8">{t('العنوان', 'Title')}</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('المحاضر', 'Instructor')}</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('السعر', 'Price')}</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('الحالة', 'Status')}</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-8">{t('الإجراءات', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="font-bold py-5 px-8 text-white group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-3">
                          {course.thumbnail_url ? (
                             <img src={course.thumbnail_url} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="Thumb" />
                          ) : (
                             <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"><BookOpen className="w-4 h-4 text-slate-500"/></div>
                          )}
                          <span>{language === 'ar' ? course.title_ar : course.title_en}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en || '-'}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-400">
                        {course.price_usd ? `$${course.price_usd}` : <span className="text-slate-500 text-xs">FREE</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          course.is_published 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {course.is_published ? t('منشور', 'Published') : t('مسودة', 'Draft')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(course)}
                            className="hover:bg-blue-500/10 text-blue-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-red-500/10 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0a0f1e] border-white/10 text-white rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-xl italic">{t('تأكيد الحذف', 'CONFIRM DELETION')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  {t('هل أنت متأكد من حذف هذا الكورس؟ هذا الإجراء لا يمكن التراجع عنه.', 'Are you sure you want to delete this course? This action cannot be undone.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-6 border-t border-white/5 pt-4">
                                <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(course.id)} className="bg-red-600 hover:bg-red-700">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}