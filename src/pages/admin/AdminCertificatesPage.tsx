import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses, createCertificate, getAllCertificates, deleteCertificate, updateCertificate } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Course } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Award, Trash2, Download, Upload, Eye, Edit } from 'lucide-react';
import { downloadCertificate } from '@/lib/certificatePDF';

interface CertificateData {
  id: string;
  course_id: string;
  student_id: string;
  student_full_name: string;
  description_ar: string | null;
  description_en: string | null;
  logo_url: string | null;
  instructor_signature_text: string;
  issued_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  };
  courses: {
    id: string;
    title_ar: string;
    title_en: string;
  };
}

interface StudentWithCourse {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminCertificatesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentWithCourse[]>([]);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    course_id: '',
    student_id: '',
    student_full_name: '',
    description_ar: '',
    description_en: '',
    logo_url: '',
    instructor_signature_text: '',
  });

  useEffect(() => {
    loadCourses();
    loadCertificates();
  }, []);

  useEffect(() => {
    if (formData.course_id) {
      loadStudentsForCourse();
    }
  }, [formData.course_id]);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses(false);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadStudentsForCourse = async () => {
    if (!formData.course_id) return;
    try {
      // الحصول على الطلاب الذين يمتلكون هذا الكورس
      // Get students who own this course
      const { data, error } = await supabase
        .from('user_courses')
        .select('user_id, profiles!user_courses_user_id_fkey(id, name, email)')
        .eq('course_id', formData.course_id);

      if (error) throw error;
      
      const studentsData = data
        .map((item: any) => ({
          id: item.profiles.id,
          full_name: item.profiles.name,
          email: item.profiles.email,
        }))
        .filter((profile: any) => profile.id !== null);
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل الطلاب', 'Failed to load students'),
        variant: 'destructive',
      });
    }
  };

  const loadCertificates = async () => {
    try {
      const data = await getAllCertificates();
      setCertificates(data as any);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `certificate-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل رفع اللوجو', 'Failed to upload logo'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_id || !formData.student_id || !formData.student_full_name || !formData.instructor_signature_text) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('يجب ملء جميع الحقول المطلوبة', 'All required fields must be filled'),
        variant: 'destructive',
      });
      return;
    }

    try {
      let logoUrl = formData.logo_url;

      // رفع اللوجو إذا تم اختيار ملف
      // Upload logo if file is selected
      if (logoFile) {
        const uploadedUrl = await handleLogoUpload(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      await createCertificate({
        course_id: formData.course_id,
        student_id: formData.student_id,
        student_full_name: formData.student_full_name,
        description_ar: formData.description_ar || undefined,
        description_en: formData.description_en || undefined,
        logo_url: logoUrl || undefined,
        instructor_signature_text: formData.instructor_signature_text,
      });

      toast({
        title: t('تم الإنشاء', 'Created'),
        description: t('تم إنشاء الشهادة بنجاح', 'Certificate created successfully'),
      });

      setDialogOpen(false);
      resetForm();
      loadCertificates();
    } catch (error: any) {
      console.error('Error creating certificate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: error?.message || t('فشل إنشاء الشهادة', 'Failed to create certificate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (certificateId: string) => {
    try {
      await deleteCertificate(certificateId);
      toast({
        title: t('تم الحذف', 'Deleted'),
        description: t('تم حذف الشهادة بنجاح', 'Certificate deleted successfully'),
      });
      loadCertificates();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل حذف الشهادة', 'Failed to delete certificate'),
        variant: 'destructive',
      });
    }
  };

  // معالج عرض الشهادة
  // View certificate handler
  const handleView = (certificate: CertificateData) => {
    setSelectedCertificate(certificate);
    setViewDialogOpen(true);
  };

  // معالج تحرير الشهادة
  // Edit certificate handler
  const handleEdit = (certificate: CertificateData) => {
    setSelectedCertificate(certificate);
    setFormData({
      course_id: certificate.course_id,
      student_id: certificate.student_id,
      student_full_name: certificate.student_full_name,
      description_ar: certificate.description_ar || '',
      description_en: certificate.description_en || '',
      logo_url: certificate.logo_url || '',
      instructor_signature_text: certificate.instructor_signature_text,
    });
    setEditDialogOpen(true);
  };

  // معالج حفظ التعديلات
  // Save edits handler
  const handleSaveEdit = async () => {
    if (!selectedCertificate) return;

    try {
      let logoUrl = formData.logo_url;

      // رفع الشعار الجديد إذا تم اختياره
      // Upload new logo if selected
      if (logoFile) {
        setUploading(true);
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-assets')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-assets')
          .getPublicUrl(filePath);

        logoUrl = urlData.publicUrl;
      }

      await updateCertificate(selectedCertificate.id, {
        student_full_name: formData.student_full_name,
        description_ar: formData.description_ar || undefined,
        description_en: formData.description_en || undefined,
        logo_url: logoUrl || undefined,
        instructor_signature_text: formData.instructor_signature_text,
      });

      toast({
        title: t('تم التحديث', 'Updated'),
        description: t('تم تحديث الشهادة بنجاح', 'Certificate updated successfully'),
      });

      setEditDialogOpen(false);
      resetForm();
      setSelectedCertificate(null);
      loadCertificates();
    } catch (error) {
      console.error('Error updating certificate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحديث الشهادة', 'Failed to update certificate'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // معالج تحميل الشهادة كـ PDF
  // Download certificate as PDF handler
  const handleDownloadPDF = async (certificate: CertificateData) => {
    setDownloading(true);
    try {
      const courseName = language === 'ar' ? certificate.courses.title_ar : certificate.courses.title_en;
      const issueDate = new Date(certificate.issued_at).toLocaleDateString(
        language === 'ar' ? 'ar-EG' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );

      await downloadCertificate(
        {
          studentName: certificate.student_full_name,
          courseName: courseName,
          issueDate: issueDate,
          certificateId: certificate.id,
          instructorSignature: certificate.instructor_signature_text,
          logoUrl: certificate.logo_url || undefined,
        },
        `certificate-${certificate.student_full_name}-${courseName}.pdf`
      );

      toast({
        title: t('تم التحميل', 'Downloaded'),
        description: t('تم تحميل الشهادة بنجاح', 'Certificate downloaded successfully'),
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل الشهادة', 'Failed to download certificate'),
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      student_id: '',
      student_full_name: '',
      description_ar: '',
      description_en: '',
      logo_url: '',
      instructor_signature_text: '',
    });
    setLogoFile(null);
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setFormData({
      ...formData,
      student_id: studentId,
      student_full_name: student?.full_name || '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                {t('إدارة الشهادات', 'Certificate Management')}
              </CardTitle>
              <CardDescription>
                {t('إنشاء وإدارة شهادات إتمام الكورسات', 'Create and manage course completion certificates')}
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('إنشاء شهادة', 'Create Certificate')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('إنشاء شهادة جديدة', 'Create New Certificate')}</DialogTitle>
                  <DialogDescription>
                    {t('أدخل بيانات الشهادة للطالب', 'Enter certificate details for the student')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('الكورس', 'Course')} *</Label>
                    <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('اختر الكورس', 'Select course')} />
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

                  {formData.course_id && (
                    <div className="space-y-2">
                      <Label>{t('الطالب', 'Student')} *</Label>
                      <Select value={formData.student_id} onValueChange={handleStudentChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('اختر الطالب', 'Select student')} />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name} ({student.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('الاسم الثلاثي للطالب', 'Student Full Name')} *</Label>
                    <Input
                      value={formData.student_full_name}
                      onChange={(e) => setFormData({ ...formData, student_full_name: e.target.value })}
                      placeholder={t('الاسم الثلاثي كما سيظهر في الشهادة', 'Full name as it will appear on certificate')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('وصف الشهادة (عربي)', 'Certificate Description (Arabic)')}</Label>
                      <Textarea
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                        placeholder={t('وصف اختياري للشهادة', 'Optional certificate description')}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('وصف الشهادة (إنجليزي)', 'Certificate Description (English)')}</Label>
                      <Textarea
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        placeholder={t('وصف اختياري للشهادة', 'Optional certificate description')}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('لوجو الكورس أو الفريق', 'Course or Team Logo')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                      />
                      {uploading && <span className="text-sm text-muted-foreground">{t('جاري الرفع...', 'Uploading...')}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('توقيع المحاضر', 'Instructor Signature')} *</Label>
                    <Input
                      value={formData.instructor_signature_text}
                      onChange={(e) => setFormData({ ...formData, instructor_signature_text: e.target.value })}
                      placeholder={t('اسم المحاضر للتوقيع', 'Instructor name for signature')}
                      required
                      className="font-signature text-2xl"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('سيظهر التوقيع بخط جميل مناسب للتوقيعات', 'Signature will appear in beautiful handwriting style')}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t('إلغاء', 'Cancel')}
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {t('إنشاء الشهادة', 'Create Certificate')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('الطالب', 'Student')}</TableHead>
                <TableHead>{t('الكورس', 'Course')}</TableHead>
                <TableHead>{t('تاريخ الإصدار', 'Issue Date')}</TableHead>
                <TableHead>{t('التوقيع', 'Signature')}</TableHead>
                <TableHead className="text-center">{t('الإجراءات', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('لا توجد شهادات', 'No certificates')}
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cert.student_full_name}</div>
                        <div className="text-sm text-muted-foreground">{cert.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {language === 'ar' ? cert.courses.title_ar : cert.courses.title_en}
                    </TableCell>
                    <TableCell>
                      {new Date(cert.issued_at).toLocaleDateString(
                        language === 'ar' ? 'ar-EG' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-signature text-lg" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        {cert.instructor_signature_text}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(cert)}
                          title={t('عرض', 'View')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(cert)}
                          title={t('تعديل', 'Edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(cert)}
                          disabled={downloading}
                          title={t('تحميل', 'Download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              title={t('حذف', 'Delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('تأكيد الحذف', 'Confirm Delete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('هل أنت متأكد من حذف هذه الشهادة؟', 'Are you sure you want to delete this certificate?')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cert.id)}>
                                {t('حذف', 'Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* مربع حوار عرض الشهادة */}
      {/* View Certificate Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('عرض الشهادة', 'View Certificate')}
            </DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-6">
              {/* معلومات الطالب */}
              {/* Student Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('اسم الطالب', 'Student Name')}</Label>
                  <p className="font-medium">{selectedCertificate.student_full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('البريد الإلكتروني', 'Email')}</Label>
                  <p className="font-medium">{selectedCertificate.profiles.email}</p>
                </div>
              </div>

              {/* معلومات الكورس */}
              {/* Course Information */}
              <div>
                <Label className="text-muted-foreground">{t('الكورس', 'Course')}</Label>
                <p className="font-medium">
                  {language === 'ar' ? selectedCertificate.courses.title_ar : selectedCertificate.courses.title_en}
                </p>
              </div>

              {/* الوصف */}
              {/* Description */}
              {(selectedCertificate.description_ar || selectedCertificate.description_en) && (
                <div>
                  <Label className="text-muted-foreground">{t('الوصف', 'Description')}</Label>
                  <p className="text-sm">
                    {language === 'ar' ? selectedCertificate.description_ar : selectedCertificate.description_en}
                  </p>
                </div>
              )}

              {/* التوقيع */}
              {/* Signature */}
              <div>
                <Label className="text-muted-foreground">{t('توقيع المدرس', 'Instructor Signature')}</Label>
                <p className="text-2xl font-signature" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  {selectedCertificate.instructor_signature_text}
                </p>
              </div>

              {/* الشعار */}
              {/* Logo */}
              {selectedCertificate.logo_url && (
                <div>
                  <Label className="text-muted-foreground">{t('الشعار', 'Logo')}</Label>
                  <img 
                    src={selectedCertificate.logo_url} 
                    alt="Certificate Logo" 
                    className="h-20 object-contain mt-2"
                  />
                </div>
              )}

              {/* تاريخ الإصدار */}
              {/* Issue Date */}
              <div>
                <Label className="text-muted-foreground">{t('تاريخ الإصدار', 'Issue Date')}</Label>
                <p className="font-medium">
                  {new Date(selectedCertificate.issued_at).toLocaleDateString(
                    language === 'ar' ? 'ar-EG' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>

              {/* أزرار الإجراءات */}
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadPDF(selectedCertificate)}
                  disabled={downloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? t('جاري التحميل...', 'Downloading...') : t('تحميل PDF', 'Download PDF')}
                </Button>
                <Button onClick={() => {
                  setViewDialogOpen(false);
                  handleEdit(selectedCertificate);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('تعديل', 'Edit')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مربع حوار تعديل الشهادة */}
      {/* Edit Certificate Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t('تعديل الشهادة', 'Edit Certificate')}
            </DialogTitle>
            <DialogDescription>
              {t('تعديل معلومات الشهادة', 'Edit certificate information')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* اسم الطالب */}
            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-student-name">{t('اسم الطالب', 'Student Name')}</Label>
              <Input
                id="edit-student-name"
                value={formData.student_full_name}
                onChange={(e) => setFormData({ ...formData, student_full_name: e.target.value })}
                placeholder={t('أدخل اسم الطالب', 'Enter student name')}
              />
            </div>

            {/* الوصف بالعربية */}
            {/* Description in Arabic */}
            <div className="space-y-2">
              <Label htmlFor="edit-desc-ar">{t('الوصف (عربي)', 'Description (Arabic)')}</Label>
              <Textarea
                id="edit-desc-ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder={t('أدخل الوصف بالعربية', 'Enter description in Arabic')}
                rows={3}
              />
            </div>

            {/* الوصف بالإنجليزية */}
            {/* Description in English */}
            <div className="space-y-2">
              <Label htmlFor="edit-desc-en">{t('الوصف (إنجليزي)', 'Description (English)')}</Label>
              <Textarea
                id="edit-desc-en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder={t('أدخل الوصف بالإنجليزية', 'Enter description in English')}
                rows={3}
              />
            </div>

            {/* توقيع المدرس */}
            {/* Instructor Signature */}
            <div className="space-y-2">
              <Label htmlFor="edit-signature">{t('توقيع المدرس', 'Instructor Signature')}</Label>
              <Input
                id="edit-signature"
                value={formData.instructor_signature_text}
                onChange={(e) => setFormData({ ...formData, instructor_signature_text: e.target.value })}
                placeholder={t('أدخل نص التوقيع', 'Enter signature text')}
                style={{ fontFamily: "'Dancing Script', cursive" }}
                className="text-xl"
              />
            </div>

            {/* رفع الشعار */}
            {/* Upload Logo */}
            <div className="space-y-2">
              <Label htmlFor="edit-logo">{t('شعار الشهادة', 'Certificate Logo')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                {formData.logo_url && !logoFile && (
                  <img src={formData.logo_url} alt="Current Logo" className="h-10 object-contain" />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialogOpen(false);
                resetForm();
                setSelectedCertificate(null);
              }}
              disabled={uploading}
            >
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={uploading}>
              {uploading ? t('جاري الحفظ...', 'Saving...') : t('حفظ التعديلات', 'Save Changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
