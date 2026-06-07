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
import { Plus, Award, Trash2, Download, Eye, Edit, Calendar, History } from 'lucide-react';
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
  updated_at?: string;
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

  const handleView = (certificate: CertificateData) => {
    setSelectedCertificate(certificate);
    setViewDialogOpen(true);
  };

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

  const handleSaveEdit = async () => {
    if (!selectedCertificate) return;

    try {
      let logoUrl = formData.logo_url;

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
    <div className="space-y-6 animate-in fade-in duration-500" dir="ltr">
      <Card className="bg-[#0a0f1e] border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 p-6 md:p-8">
          <div>
            <CardTitle className="text-2xl font-black italic flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-500" />
              {t('إدارة الشهادات', 'CERTIFICATES')}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {t('إنشاء وإدارة شهادات إتمام الكورسات', 'Create and manage course completion certificates')}
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-blue-900/20">
                <Plus className="w-4 h-4 mr-2" />
                {t('إنشاء شهادة', 'Create Certificate')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0f1e] border-white/10 text-white rounded-[2rem] p-4 md:p-10 custom-scrollbar">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black italic">{t('إنشاء شهادة جديدة', 'NEW CERTIFICATE')}</DialogTitle>
                <DialogDescription className="text-slate-500">
                  {t('أدخل بيانات الشهادة للطالب', 'Enter certificate details for the student')}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الكورس', 'Course')} *</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder={t('اختر الكورس', 'Select course')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1e] text-white border-white/10">
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
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الطالب', 'Student')} *</Label>
                    <Select value={formData.student_id} onValueChange={handleStudentChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                        <SelectValue placeholder={t('اختر الطالب', 'Select student')} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0f1e] text-white border-white/10">
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
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الاسم الثلاثي للطالب', 'Student Full Name')} *</Label>
                  <Input
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={formData.student_full_name}
                    onChange={(e) => setFormData({ ...formData, student_full_name: e.target.value })}
                    placeholder={t('الاسم الثلاثي كما سيظهر في الشهادة', 'Full name as it will appear on certificate')}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('وصف الشهادة (عربي)', 'Desc (AR)')}</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 rounded-xl"
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('وصف الشهادة (إنجليزي)', 'Desc (EN)')}</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 rounded-xl"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('لوجو الكورس أو الفريق', 'Course Logo')}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-white/5 border-white/10 h-auto py-2 rounded-xl flex-1"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    {uploading && <span className="text-xs text-blue-400 font-bold animate-pulse">{t('جاري الرفع...', 'Uploading...')}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('توقيع المحاضر', 'Instructor Signature')} *</Label>
                  <Input
                    value={formData.instructor_signature_text}
                    onChange={(e) => setFormData({ ...formData, instructor_signature_text: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 h-12 rounded-xl font-signature text-2xl text-blue-400"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
                  <Button type="submit" className="bg-blue-600 px-10 rounded-xl" disabled={uploading}>
                    {t('إنشاء الشهادة', 'Create Certificate')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8">{t('الطالب', 'Student')}</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">{t('الكورس', 'Course')}</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest flex items-center gap-1 mt-6"><Calendar className="w-3 h-3"/> {t('الإصدار', 'Issued')}</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest"><div className="flex items-center gap-1"><History className="w-3 h-3"/> {t('التحديث', 'Updated')}</div></TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-8">{t('الإجراءات', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-500 font-mono italic">
                      NO_CERTIFICATES_FOUND_
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert) => (
                    <TableRow key={cert.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-6 px-8">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{cert.student_full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{cert.profiles.email}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {language === 'ar' ? cert.courses.title_ar : cert.courses.title_en}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-500">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-blue-500/50">
                        {cert.updated_at ? new Date(cert.updated_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleView(cert)}
                            className="hover:bg-blue-500/10 text-blue-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(cert)}
                            className="hover:bg-emerald-500/10 text-emerald-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownloadPDF(cert)}
                            disabled={downloading}
                            className="hover:bg-purple-500/10 text-purple-400"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-red-500/10 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0a0f1e] border-white/10 text-white rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-xl italic">{t('تأكيد الحذف', 'CONFIRM DELETE')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  {t('هل أنت متأكد من حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this certificate? This cannot be undone.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-6 border-t border-white/5 pt-4">
                                <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cert.id)} className="bg-red-600 hover:bg-red-700">
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
          </div>
        </CardContent>
      </Card>

      {/* --- View Certificate Dialog --- */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0f1e] border-white/10 text-white rounded-[2rem] p-4 md:p-10 custom-scrollbar">
          <DialogHeader className="mb-6 border-b border-white/5 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase">
              <Eye className="h-6 w-6 text-blue-500" />
              {t('تفاصيل الشهادة', 'CERTIFICATE DETAILS')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-[1.5rem]">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{t('اسم الطالب', 'Student Name')}</Label>
                  <p className="font-bold text-lg text-white">{selectedCertificate.student_full_name}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{t('البريد الإلكتروني', 'Email')}</Label>
                  <p className="font-mono text-blue-400">{selectedCertificate.profiles.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{t('الكورس', 'Course')}</Label>
                <p className="font-bold text-xl border-l-4 border-blue-500 pl-4 py-1">
                  {language === 'ar' ? selectedCertificate.courses.title_ar : selectedCertificate.courses.title_en}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(selectedCertificate.description_ar || selectedCertificate.description_en) && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{t('الوصف', 'Description')}</Label>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {language === 'ar' ? selectedCertificate.description_ar : selectedCertificate.description_en}
                    </p>
                  </div>
                )}

                <div className="bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{t('توقيع المدرس', 'Signature')}</Label>
                  <p className="text-3xl text-blue-400" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    {selectedCertificate.instructor_signature_text}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">{t('تاريخ الإصدار', 'Issue Date')}</Label>
                  <p className="font-mono text-sm text-emerald-400">
                    {new Date(selectedCertificate.issued_at).toLocaleDateString()}
                  </p>
                </div>
                
                {selectedCertificate.logo_url && (
                  <div className="text-right">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{t('الشعار', 'Logo')}</Label>
                    <img src={selectedCertificate.logo_url} alt="Logo" className="h-12 object-contain bg-white/10 rounded-lg p-1" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setViewDialogOpen(false); handleEdit(selectedCertificate); }} className="bg-transparent border-white/10 hover:bg-white/5">
                  <Edit className="h-4 w-4 mr-2" /> {t('تعديل', 'Edit')}
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedCertificate)} disabled={downloading} className="bg-blue-600 hover:bg-blue-500 px-8 rounded-xl">
                  <Download className="h-4 w-4 mr-2" /> {downloading ? t('جاري التحميل...', 'Downloading...') : t('تحميل PDF', 'Download PDF')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Edit Certificate Dialog --- */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0f1e] border-white/10 text-white rounded-[2rem] p-4 md:p-10 custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase">
              <Edit className="h-6 w-6 text-emerald-500" />
              {t('تعديل الشهادة', 'EDIT CERTIFICATE')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('اسم الطالب', 'Student Name')}</Label>
              <Input
                className="bg-white/5 border-white/10 h-12 rounded-xl"
                value={formData.student_full_name}
                onChange={(e) => setFormData({ ...formData, student_full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (عربي)', 'Desc (AR)')}</Label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-xl"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('الوصف (إنجليزي)', 'Desc (EN)')}</Label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-xl"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('توقيع المدرس', 'Instructor Signature')}</Label>
              <Input
                className="bg-white/5 border-white/10 h-12 rounded-xl text-xl text-emerald-400"
                style={{ fontFamily: "'Dancing Script', cursive" }}
                value={formData.instructor_signature_text}
                onChange={(e) => setFormData({ ...formData, instructor_signature_text: e.target.value })}
              />
            </div>

            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-3">{t('شعار الشهادة', 'Certificate Logo')}</Label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  className="bg-transparent border-white/10 py-2 flex-1"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                {formData.logo_url && !logoFile && (
                  <div className="bg-black/40 p-2 rounded-lg border border-white/10">
                     <img src={formData.logo_url} alt="Current Logo" className="h-10 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6">
            <Button 
              variant="ghost" 
              onClick={() => { setEditDialogOpen(false); resetForm(); setSelectedCertificate(null); }}
              disabled={uploading}
            >
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-500 px-8 rounded-xl">
              {uploading ? t('جاري الحفظ...', 'Saving...') : t('حفظ التعديلات', 'Save Changes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}