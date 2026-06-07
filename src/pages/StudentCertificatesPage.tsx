import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCertificatesByStudent } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Download, Calendar, BookOpen, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { downloadCertificate } from '@/lib/certificatePDF';

interface Certificate {
  id: string;
  course_id: string;
  student_id: string;
  student_full_name: string;
  description_ar: string | null;
  description_en: string | null;
  logo_url: string | null;
  instructor_signature_text: string;
  issued_at: string;
  courses: {
    id: string;
    title_ar: string;
    title_en: string;
    thumbnail_url: string | null;
  };
}

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCertificatesByStudent(user.id);
      setCertificates(data as any);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
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

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8 text-amber-500" />
          {t('شهاداتي', 'My Certificates')}
        </h1>
        <p className="text-muted-foreground">
          {t('عرض وتنزيل الشهادات التي حصلت عليها', 'View and download your earned certificates')}
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {t('لا توجد شهادات بعد', 'No Certificates Yet')}
            </h3>
            <p className="text-muted-foreground">
              {t('أكمل الكورسات للحصول على الشهادات', 'Complete courses to earn certificates')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                {certificate.logo_url ? (
                  <img
                    src={certificate.logo_url}
                    alt="Logo"
                    className="h-20 w-20 object-contain"
                  />
                ) : (
                  <Award className="h-20 w-20 text-primary opacity-50" />
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {language === 'ar' ? certificate.courses.title_ar : certificate.courses.title_en}
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(certificate.issued_at).toLocaleDateString(
                      language === 'ar' ? 'ar-EG' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    {certificate.student_full_name}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedCertificate(certificate)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('عرض', 'View')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Award className="h-6 w-6 text-amber-500" />
                          {t('شهادة إتمام الكورس', 'Course Completion Certificate')}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedCertificate && (
                        <div className="space-y-6 py-4">
                          {/* Certificate Preview */}
                          <div className="border-4 border-primary/20 rounded-lg p-8 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
                            <div className="text-center space-y-6">
                              {/* Logo */}
                              {selectedCertificate.logo_url && (
                                <div className="flex justify-center">
                                  <img
                                    src={selectedCertificate.logo_url}
                                    alt="Logo"
                                    className="h-24 w-24 object-contain"
                                  />
                                </div>
                              )}

                              {/* Title */}
                              <div>
                                <h2 className="text-3xl font-bold text-primary mb-2">
                                  {t('شهادة إتمام', 'Certificate of Completion')}
                                </h2>
                                <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
                              </div>

                              {/* Student Name */}
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {t('هذا يشهد بأن', 'This certifies that')}
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                  {selectedCertificate.student_full_name}
                                </p>
                              </div>

                              {/* Course Name */}
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {t('قد أتم بنجاح كورس', 'has successfully completed the course')}
                                </p>
                                <p className="text-xl font-semibold text-primary">
                                  {language === 'ar' 
                                    ? selectedCertificate.courses.title_ar 
                                    : selectedCertificate.courses.title_en}
                                </p>
                              </div>

                              {/* Description */}
                              {(selectedCertificate.description_ar || selectedCertificate.description_en) && (
                                <div className="max-w-md mx-auto">
                                  <p className="text-sm text-muted-foreground">
                                    {language === 'ar' 
                                      ? selectedCertificate.description_ar 
                                      : selectedCertificate.description_en}
                                  </p>
                                </div>
                              )}

                              {/* Date and Signature */}
                              <div className="flex justify-between items-end pt-8 border-t">
                                <div className="text-left">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {t('تاريخ الإصدار', 'Issue Date')}
                                  </p>
                                  <p className="font-medium">
                                    {new Date(selectedCertificate.issued_at).toLocaleDateString(
                                      language === 'ar' ? 'ar-EG' : 'en-US',
                                      { year: 'numeric', month: 'long', day: 'numeric' }
                                    )}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {t('توقيع المحاضر', 'Instructor Signature')}
                                  </p>
                                  <p 
                                    className="text-3xl font-signature"
                                    style={{ fontFamily: "'Dancing Script', cursive" }}
                                  >
                                    {selectedCertificate.instructor_signature_text}
                                  </p>
                                </div>
                              </div>

                              {/* Luvia Logo/Brand */}
                              <div className="pt-4">
                                <p className="text-sm text-muted-foreground">
                                  {t('منصة Luvia التعليمية', 'Luvia Educational Platform')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Download Button */}
                          <div className="flex justify-center">
                            <Button 
                              onClick={() => handleDownload(selectedCertificate)}
                              disabled={downloading}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {downloading 
                                ? t('جاري التحميل...', 'Downloading...') 
                                : t('تنزيل الشهادة', 'Download Certificate')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleDownload(certificate)}
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? t('جاري التحميل...', 'Downloading...') : t('تنزيل', 'Download')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
