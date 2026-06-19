import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCourseWithLessons, checkUserOwnsCourse, redeemVoucher, getSetting } from '@/db/api';
import type { CourseWithLessons } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { BookOpen, Lock, CheckCircle, MessageCircle, User, Star, Globe, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetailsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownsCourse, setOwnsCourse] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId, user]);

  const loadCourse = async () => {
    try {
      const data = await getCourseWithLessons(courseId!);

      if (!data) {
        navigate('/404');
        return;
      }

      setCourse(data);

      if (user) {
        const owns = await checkUserOwnsCourse(user.id, courseId!);
        setOwnsCourse(owns);
      }

      const number = data.whatsapp_number || (await getSetting('default_whatsapp_number'))?.value || '';
      setWhatsappNumber(number);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!user) {
      toast({ title: t('لازم تسجل الدخول', 'Login Required'), variant: 'destructive' });
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!voucherCode.trim()) {
      toast({ title: t('خطأ', 'Error'), description: t('دخل كود التفعيل', 'Please enter code'), variant: 'destructive' });
      return;
    }

    setRedeeming(true);
    try {
      await redeemVoucher(voucherCode.trim(), user.id);
      toast({ title: t('تم التفعيل بنجاح', 'Activation Successful') });
      setOwnsCourse(true);
      setVoucherCode('');
    } catch (error: any) {
      toast({ title: t('فشل التفعيل', 'Activation Failed'), description: error.message, variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      t(
        `مرحباً، عايز اشتري كود تفعيل لكورس: ${course?.title_ar}`,
        `Hello, I want to purchase a voucher for: ${course?.title_en}`
      )
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] p-6 sm:p-8 space-y-6 antialiased">
        <Skeleton className="h-[380px] w-full rounded-2xl bg-slate-900/50 border border-slate-800/40 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-72 rounded-2xl bg-slate-900/50 border border-slate-800/40 animate-pulse" />
          <Skeleton className="h-72 rounded-2xl bg-slate-900/50 border border-slate-800/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-16 relative overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- AMBIENT PREMIUM GLOWS --- */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 pt-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* --- MAIN CONTENT --- */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="bg-slate-900/20 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                
                {/* Image Banner Header */}
                <div className="relative h-[320px] sm:h-[380px] group bg-slate-950">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      alt="Course Preview"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900/50 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-slate-800" />
                    </div>
                  )}

                  {/* Dark Overlays for Premium Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:opacity-0 transition-opacity" />

                  {/* Absolute Content Over Banner */}
                  <div className="absolute bottom-6 right-5 left-5 text-right rtl:text-right">
                    <Badge className="mb-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-3.5 py-1 text-xs font-semibold rounded-md backdrop-blur-md shadow-sm">
                      {course.lessons.length} {t('محاضرة', 'Lessons')}
                    </Badge>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white max-w-3xl drop-shadow-md">
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </h1>
                  </div>
                </div>

                {/* Meta details bar */}
                <CardContent className="pt-6 px-6 sm:px-8 pb-8">
                  <div className="flex flex-wrap gap-2.5 mb-6 pb-5 border-b border-slate-900">
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/60 px-3.5 py-2 rounded-lg backdrop-blur-sm">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-medium">
                        {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/60 px-3.5 py-2 rounded-lg backdrop-blur-sm">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/10" />
                      <span className="font-medium text-slate-300">4.9 (Student Choice)</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/60 px-3.5 py-2 rounded-lg backdrop-blur-sm">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-medium">{language === 'ar' ? 'العربية' : 'Arabic / English'}</span>
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap opacity-95 max-w-3xl">
                    {language === 'ar' ? course.description_ar : course.description_en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* --- LESSONS LIST --- */}
            <Card className="bg-slate-900/10 border border-slate-900 rounded-2xl p-5 sm:p-6 shadow-md backdrop-blur-sm">
              <CardHeader className="px-1.5 pb-4 pt-1">
                <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-slate-100">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                  {t('محتوى المنهج', 'Course Curriculum')}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 px-1.5">
                {course.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    whileHover={ownsCourse ? { x: language === 'ar' ? -4 : 4 } : {}}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${ownsCourse
                        ? 'bg-slate-900/40 border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-900/90 cursor-pointer shadow-sm'
                        : 'bg-slate-950/20 border-slate-900/40 opacity-40 select-none'
                      }`}
                    onClick={() => ownsCourse && navigate(`/course/${courseId}/view`)}
                  >
                    <div className="flex items-center gap-3.5 text-right rtl:text-right">
                      <span className="text-lg font-bold font-mono text-slate-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">
                        {language === 'ar' ? lesson.title_ar : lesson.title_en}
                      </span>
                    </div>

                    {ownsCourse ? (
                      <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/30">
                        <Lock className="h-4 w-4 text-slate-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* --- SIDEBAR PANEL --- */}
          <div className="space-y-6 lg:sticky lg:top-6">
            {!ownsCourse ? (
              <Card className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
                <CardHeader className="text-center pt-1 px-1 pb-4">
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">
                    {t('سعر الكورس', 'Price')}
                  </div>

                  <div className="text-4xl font-extrabold text-white mb-5 tracking-tight font-sans">
                    ${course.price_usd}
                  </div>

                  <CardTitle className="text-base font-bold text-slate-200">
                    {t('تفعيل المحتوى', 'Activate Course')}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    {t('دخل كود التفعيل للبدء', 'Enter your code to unlock')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 px-1 pb-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 ml-1">
                      {t('كود التفعيل', 'Voucher Code')}
                    </Label>

                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="h-12 bg-slate-950/60 border-slate-800 rounded-xl text-center font-mono text-base tracking-widest focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all text-white placeholder:text-slate-800 uppercase"
                      placeholder="LUV-XXXXXX"
                    />
                  </div>

                  <Button
                    onClick={handleRedeemVoucher}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98]"
                    disabled={redeeming}
                  >
                    {redeeming ? t('جاري التفعيل...', 'Activating...') : t('تفعيل الآن', 'Activate Now')}
                  </Button>

                  {whatsappNumber && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-2 py-1">
                        <div className="h-[1px] bg-slate-800/80 flex-1" />
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                          {t('أو شراء كود', 'Or buy code')}
                        </span>
                        <div className="h-[1px] bg-slate-800/80 flex-1" />
                      </div>

                      <Button
                        onClick={handleWhatsAppContact}
                        variant="outline"
                        className="w-full h-11 border-slate-800 text-emerald-400 hover:bg-emerald-500/5 hover:border-emerald-500/20 rounded-xl font-semibold text-xs flex gap-2 bg-slate-950/30 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        {t('طلب كود تفعيل عبر واتساب', 'Request code via WhatsApp')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Ownership Enrolled State */
              <Card className="bg-emerald-500/[0.02] border border-emerald-500/20 backdrop-blur-md rounded-2xl p-6 text-center shadow-lg">
                <div className="w-16 h-16 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>

                <CardTitle className="text-xl font-bold text-slate-100 mb-1">
                  {t('أنت مشترك بالفعل', 'You are Enrolled')}
                </CardTitle>

                <CardDescription className="text-xs text-slate-500 mb-6">
                  {t('المحتوى متاح لك بالكامل الآن', 'Full access is granted')}
                </CardDescription>

                <Button
                  onClick={() => navigate(`/course/${courseId}/view`)}
                  className="w-full h-12 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <BookOpen className="mr-2 ml-2 h-4 w-4" />
                  {t('ابدأ التعلم', 'Start Learning')}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}