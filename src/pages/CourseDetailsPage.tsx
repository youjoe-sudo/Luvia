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
    const message = encodeURIComponent(t(`مرحباً، عايز اشتري كود تفعيل لكورس: ${course?.title_ar}`, `Hello, I want to purchase a voucher for: ${course?.title_en}`));
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] p-8 space-y-6">
        <Skeleton className="h-[400px] w-full rounded-[2.5rem] bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-64 rounded-[2.5rem] bg-white/5" />
          <Skeleton className="h-64 rounded-[2.5rem] bg-white/5" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] -z-10" />

      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border-b-4 border-b-blue-600/20 shadow-2xl">
                <div className="relative h-[350px] group">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Course" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                      <BookOpen className="h-32 w-32 text-blue-500/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                  <div className="absolute bottom-6 right-6 left-6">
                    <Badge className="mb-3 bg-blue-600 text-white border-none px-4 py-1 rounded-full text-sm font-bold">
                      {course.lessons.length} {t('محاضرة', 'Lessons')}
                    </Badge>
                    <h1 className="text-4xl font-black tracking-tight leading-tight">
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </h1>
                  </div>
                </div>
                
                <CardContent className="pt-8 px-8">
                  <div className="flex flex-wrap gap-6 mb-8 text-sm text-slate-400 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}</div>
                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> 4.9 (Student Choice)</div>
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> {language === 'ar' ? 'العربية' : 'Arabic / English'}</div>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap italic opacity-90">
                    {language === 'ar' ? course.description_ar : course.description_en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lessons List */}
            <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-6 shadow-xl">
              <CardHeader className="px-4">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-600 rounded-full" />
                  {t('محتوى المنهج', 'Course Curriculum')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    whileHover={ownsCourse ? { x: 10 } : {}}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      ownsCourse 
                      ? 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-blue-600/5 cursor-pointer shadow-lg' 
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                    onClick={() => ownsCourse && navigate(`/course/${courseId}/view`)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-white/10">{String(index + 1).padStart(2, '0')}</span>
                      <span className="font-bold text-slate-200">
                        {language === 'ar' ? lesson.title_ar : lesson.title_en}
                      </span>
                    </div>
                    {ownsCourse ? (
                      <div className="bg-green-500/20 p-2 rounded-full"><CheckCircle className="h-5 w-5 text-green-400" /></div>
                    ) : (
                      <Lock className="h-5 w-5 text-slate-600" />
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {!ownsCourse ? (
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-6 sticky top-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-t-4 border-t-purple-600/30">
                <CardHeader className="text-center pt-2">
                  <div className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">{t('سعر الكورس', 'Price')}</div>
                  <div className="text-5xl font-black text-white mb-6">${course.price_usd}</div>
                  <CardTitle className="text-xl">{t('تفعيل المحتوى', 'Activate Course')}</CardTitle>
                  <CardDescription className="text-slate-400">{t('دخل كود التفعيل للبدء', 'Enter your code to unlock')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-slate-400 ml-1">{t('كود التفعيل', 'Voucher Code')}</Label>
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-center font-mono text-xl tracking-widest focus:border-purple-500 transition-all"
                      placeholder="LUV-XXXXXX"
                    />
                  </div>
                  <Button
                    onClick={handleRedeemVoucher}
                    className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
                    disabled={redeeming}
                  >
                    {redeeming ? t('جاري التفعيل...', 'Activating...') : t('تفعيل الآن', 'Activate Now')}
                  </Button>

                  {whatsappNumber && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{t('أو شراء كود', 'Or buy code')}</span>
                        <div className="h-[1px] bg-white/10 flex-1" />
                      </div>
                      <Button
                        onClick={handleWhatsAppContact}
                        variant="outline"
                        className="w-full h-14 border-green-500/30 text-green-400 hover:bg-green-500/10 rounded-2xl font-bold flex gap-3"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {t('واتساب', 'WhatsApp')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-green-500/5 border-green-500/20 backdrop-blur-2xl rounded-[2.5rem] p-8 text-center sticky top-8 border-t-4 border-t-green-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-green-400" />
                </div>
                <CardTitle className="text-2xl font-black text-white mb-2">{t('أنت مشترك بالفعل', 'You are Enrolled')}</CardTitle>
                <CardDescription className="text-slate-400 mb-8">{t('المحتوى متاح لك بالكامل الآن', 'Full access is granted')}</CardDescription>
                <Button
                  onClick={() => navigate(`/course/${courseId}/view`)}
                  className="w-full h-16 bg-white text-black hover:bg-slate-200 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95"
                >
                  <BookOpen className="mr-3 h-6 w-6" />
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