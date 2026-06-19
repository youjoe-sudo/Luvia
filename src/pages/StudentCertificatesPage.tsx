import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCertificatesByStudent } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Download, Calendar, BookOpen, Eye, ShieldCheck, RefreshCw } from 'lucide-react';
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
    try {
      const data = await getCertificatesByStudent(user!.id);
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      toast({
        title: t('خطأ في تحميل الشهادات', 'Error loading certificates'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    setDownloading(true);
    try {
      await downloadCertificate({
        id: certificate.id,
        studentName: certificate.student_full_name,
        courseTitle: language === 'ar' ? certificate.courses.title_ar : certificate.courses.title_en,
        description: language === 'ar' 
          ? certificate.description_ar || 'لإتمام متطلبات الدورة التعليمية بنجاح' 
          : certificate.description_en || 'For successfully completing the course requirements',
        issuedAt: certificate.issued_at,
        instructorSignature: certificate.instructor_signature_text
      });
      
      toast({
        title: t('تم تحميل الشهادة بنجاح', 'Certificate downloaded successfully'),
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: t('فشل تحميل الشهادة', 'Failed to download certificate'),
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] p-6 sm:p-8 space-y-6 antialiased" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-44 bg-slate-900/50 border border-slate-800/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 sm:p-8 relative overflow-hidden font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- PREMIUM AMBIENT GLOWS --- */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.03] blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.02] blur-[130px] pointer-events-none -z-10" />

      {/* Header View */}
      <div className="mb-10 text-right rtl:text-right">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 justify-start">
          <div className="w-2 h-7 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          {t('شهاداتي التعليمية', 'My Certificates')}
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 mr-5">
          {t('كل إنجازاتك وجوائزك الأكاديمية موثقة ومتاحة للتنزيل في أي وقت', 'All your academic achievements and awards are documented and available anytime')}
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-2xl text-center p-8 max-w-md mx-auto opacity-40 mt-12">
          <Award className="h-12 w-12 text-slate-600 mb-3 animate-[pulse_4s_infinite]" />
          <h3 className="text-sm font-bold text-slate-300 mb-1">{t('لا توجد شهادات حتى الآن', 'No certificates yet')}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{t('أكمل كورساتك واجتز الاختبارات لتضيء لوحتك بالشهادات الفاخرة!', 'Complete your enrolled courses and clear modules to earn certificates here!')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {certificates.map((certificate) => (
            <Card 
              key={certificate.id} 
              className="group bg-slate-900/30 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-slate-900/80 flex flex-col h-full relative"
            >
              <CardHeader className="p-5 pb-3 text-right rtl:text-right">
                <div className="flex items-center justify-between gap-3 mb-3 flex-row-reverse">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Award className="h-5 w-5 text-amber-400" />
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/60 border border-slate-900 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{new Date(certificate.issued_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                  {language === 'ar' ? certificate.courses.title_ar : certificate.courses.title_en}
                </CardTitle>
                
                <CardDescription className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                  <BookOpen className="w-3 h-3 text-slate-600" />
                  {t('مسار تعليمي متكامل', 'Full Course Track')}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between text-right rtl:text-right">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 opacity-90 mb-5">
                  {language === 'ar' ? certificate.description_ar : certificate.description_en}
                </p>

                {/* Micro Buttons Controls */}
                <div className="flex gap-2.5 mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white rounded-xl font-bold text-xs flex gap-2 px-3 bg-slate-950/30 transition-all cursor-pointer"
                        onClick={() => setSelectedCertificate(certificate)}
                      >
                        <Eye className="h-4 w-4 text-blue-400" />
                        {t('معاينة', 'Preview')}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-slate-950/95 border border-slate-800 backdrop-blur-xl max-w-2xl w-[92%] rounded-2xl p-6 shadow-2xl text-slate-200">
                      <DialogHeader className="pb-4 border-b border-slate-900 text-right rtl:text-right">
                        <DialogTitle className="text-base font-bold text-slate-200 flex items-center gap-2">
                          <Award className="h-5 w-5 text-amber-400" />
                          {t('تفاصيل ومعاينة الشهادة المعتمدة', 'Certificate Authentication & Details')}
                        </DialogTitle>
                      </DialogHeader>

                      {selectedCertificate && (
                        <div className="space-y-6 pt-5">
                          {/* Royal Gold Frame Preview */}
                          <div className="border-2 border-amber-500/20 bg-slate-900/40 p-6 rounded-xl text-center relative overflow-hidden shadow-inner border-b-4 border-b-amber-500/30">
                            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-amber-500/[0.02] blur-3xl rounded-full pointer-events-none" />
                            
                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                              <ShieldCheck className="h-6 w-6 text-amber-400" />
                            </div>

                            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">{t('شهادة إتمام معتمدة', 'Certificate of Completion')}</h3>
                            
                            <p className="text-xs text-slate-500 mb-1">{t('تمنح هذه الشهادة بكل فخر لـ', 'This is proudly presented to')}</p>
                            <h2 className="text-xl font-extrabold text-white mb-4 tracking-tight">{selectedCertificate.student_full_name}</h2>
                            
                            <p className="text-xs text-slate-500 mb-1">{t('وذلك لاجتيازه كورس بنجاح وبأداء متميز:', 'For successfully fulfilling the standards of course:')}</p>
                            <h4 className="text-base font-bold text-slate-200 mb-5">
                              {language === 'ar' ? selectedCertificate.courses.title_ar : selectedCertificate.courses.title_en}
                            </h4>

                            <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto italic opacity-95">
                              "{language === 'ar' ? selectedCertificate.description_ar : selectedCertificate.description_en}"
                            </p>

                            <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-950 text-[10px] text-slate-500 font-mono">
                              <div>
                                <p className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">{t('المحاضر المسؤول', 'Authorized Instructor')}</p>
                                <p className="font-bold text-slate-300">{selectedCertificate.instructor_signature_text}</p>
                              </div>
                              <div className="text-left">
                                <p className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">{t('جهة الاعتماد', 'Credential Source')}</p>
                                <p className="font-bold text-amber-500/80">
                                  {t('منصة Luvia التعليمية', 'Luvia Educational Platform')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Button inside Dialog */}
                          <div className="flex justify-center pt-1">
                            <Button 
                              onClick={() => handleDownload(selectedCertificate)}
                              disabled={downloading}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-11 rounded-xl px-6 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
                            >
                              {downloading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  {t('جاري التحميل...', 'Downloading...')}
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  {t('تنزيل الشهادة الرسمية (PDF)', 'Download Official Certificate (PDF)')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="default"
                    className="flex-1 h-10 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold text-xs flex gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    onClick={() => handleDownload(certificate)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-600" />
                        {t('جاري التحميل...', 'Downloading...')}
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        {t('تنزيل الشهادة', 'Download')}
                      </>
                    )}
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