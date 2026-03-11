import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCourseWithLessons, checkUserOwnsCourse, redeemVoucher, getSetting } from '@/db/api';
import type { CourseWithLessons } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Lock, CheckCircle, MessageCircle } from 'lucide-react';
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

      // Check if user owns the course
      if (user) {
        const owns = await checkUserOwnsCourse(user.id, courseId!);
        setOwnsCourse(owns);
      }

      // Get WhatsApp number
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
      toast({
        title: t('يجب تسجيل الدخول', 'Login Required'),
        description: t('يجب تسجيل الدخول لتفعيل الكود', 'You must login to redeem a voucher'),
        variant: 'destructive',
      });
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!voucherCode.trim()) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('الرجاء إدخال كود التفعيل', 'Please enter a voucher code'),
        variant: 'destructive',
      });
      return;
    }

    setRedeeming(true);
    try {
      await redeemVoucher(voucherCode.trim(), user.id);
      toast({
        title: t('تم التفعيل بنجاح', 'Activation Successful'),
        description: t('تم تفعيل الكورس بنجاح', 'Course activated successfully'),
      });
      setOwnsCourse(true);
      setVoucherCode('');
    } catch (error: any) {
      toast({
        title: t('فشل التفعيل', 'Activation Failed'),
        description: error.message || t('كود غير صالح', 'Invalid voucher code'),
        variant: 'destructive',
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      t(
        `مرحباً، أريد شراء كود تفعيل لكورس: ${course?.title_ar}`,
        `Hello, I want to purchase a voucher code for course: ${course?.title_en}`
      )
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full mb-6 bg-muted" />
        <Skeleton className="h-8 w-1/2 mb-4 bg-muted" />
        <Skeleton className="h-4 w-full mb-2 bg-muted" />
        <Skeleton className="h-4 w-3/4 bg-muted" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <Card>
            <CardHeader>
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={language === 'ar' ? course.title_ar : course.title_en}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-md flex items-center justify-center mb-4">
                  <BookOpen className="h-24 w-24 text-primary" />
                </div>
              )}
              <CardTitle className="text-3xl">
                {language === 'ar' ? course.title_ar : course.title_en}
              </CardTitle>
              {course.instructor_name_ar && (
                <CardDescription className="text-lg">
                  {t('المحاضر:', 'Instructor:')} {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {language === 'ar' ? course.description_ar : course.description_en}
              </p>
            </CardContent>
          </Card>

          {/* Lessons List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('محتوى الكورس', 'Course Content')}</CardTitle>
              <CardDescription>
                {course.lessons.length} {t('درس', 'lessons')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      ownsCourse ? 'hover:bg-muted cursor-pointer' : 'opacity-60'
                    }`}
                    onClick={() => ownsCourse && navigate(`/course/${courseId}/view`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {language === 'ar' ? lesson.title_ar : lesson.title_en}
                      </span>
                    </div>
                    {ownsCourse ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          {course.price_usd && (
            <Card>
              <CardHeader>
                <CardTitle>{t('السعر الاسترشادي', 'Suggested Price')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-4">
                  ${course.price_usd}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voucher Activation or Start Learning */}
          {!ownsCourse ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('تفعيل الكورس', 'Activate Course')}</CardTitle>
                <CardDescription>
                  {t('أدخل كود التفعيل للوصول إلى محتوى الكورس', 'Enter voucher code to access course content')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher">{t('كود التفعيل', 'Voucher Code')}</Label>
                  <Input
                    id="voucher"
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="LUV-XXXXXX"
                    disabled={redeeming}
                  />
                </div>
                <Button
                  onClick={handleRedeemVoucher}
                  className="w-full"
                  disabled={redeeming}
                >
                  {redeeming ? t('جاري التفعيل...', 'Activating...') : t('تفعيل', 'Activate')}
                </Button>

                {whatsappNumber && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t('أو', 'or')}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleWhatsAppContact}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t('شراء عبر واتساب', 'Purchase via WhatsApp')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  {t('أنت تمتلك هذا الكورس', 'You own this course')}
                </CardTitle>
                <CardDescription>
                  {t('يمكنك البدء في التعلم الآن', 'You can start learning now')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate(`/course/${courseId}/view`)}
                  className="w-full"
                  size="lg"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t('ابدأ التعلم', 'Start Learning')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
