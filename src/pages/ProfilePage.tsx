import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, getCertificatesByStudent } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
// تم إضافة أيقونة IdCard لتمييز كود الطالب
import { User, Mail, Shield, Award, Calendar, ExternalLink, Save, Laptop, Lock, Phone, IdCard } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // حقول تعديل البيانات
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // حقول تغيير كلمة المرور
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('لم يتم العثور على جلسة تسجيل دخول نشطة');
          return;
        }

        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setName(profileData.name || '');
          // قراءة الفون من الـ profile بعد ما ضفناه في الداتابيز
          setPhone((profileData as any).phone || ''); 
        }

        const certs = await getCertificatesByStudent(user.id);
        setCertificates(certs || []);

      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الملف الشخصي');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  // دالة حفظ البيانات الأساسية (الاسم ورقم الهاتف)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      
      const updated = await updateProfile(profile.id, {
        name,
        // إرسال الفون للباك إند بعد تعديل الجدول
        ...({ phone } as any) 
      });

      setProfile(updated);
      toast.success('تم تحديث البيانات الشخصية ورقم الهاتف بنجاح! 🎉');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('فشل تحديث البيانات، تأكد من تشغيل سكريبت SQL أولاً.');
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تغيير كلمة المرور عبر Supabase Auth
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين!');
      return;
    }

    try {
      setIsUpdatingPassword(true);

      // تحديث الباسورد مباشرة في سوبابيز أوث الحامي للحساب
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('تم تغيير كلمة المرور بنجاح وبأمان! 🔐');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'فشل تحديث كلمة المرور، حاول مجدداً.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] text-lg font-bold">
        جاري تحميل ملفك الشخصي... 👤
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 dir-rtl text-right">
      
      {/* هيدر الصفحة */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/30">
            {name ? name.charAt(0).toUpperCase() : <User />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{name || 'طالب لوفيا'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Mail className="h-3.5 w-3.5" /> {profile?.email}
            </p>
          </div>
        </div>
        
        {/* قسم البطاقات التعريفية الجانبية (تمت إضافة كود الطالب هنا بجانب النقاط بشكل متناسق) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* كارت كود الطالب المميز */}
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 px-4 py-2 rounded-xl">
            <IdCard className="h-5 w-5 text-blue-600" />
            <div>
              <span className="text-xs text-muted-foreground block">كود الطالب الخاص بك</span>
              <span className="text-lg font-mono font-extrabold text-blue-600">
                {(profile as any)?.user_code || (profile as any)?.code || '----'}
              </span>
            </div>
          </div>

          {/* كارت رصيد النقاط الكلي */}
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-2 rounded-xl">
            <Shield className="h-5 w-5 text-amber-600" />
            <div>
              <span className="text-xs text-muted-foreground block">رصيد النقاط الكلي</span>
              <span className="text-lg font-extrabold text-amber-600">{(profile as any)?.points || 0} 🪙</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* عمود تعديل البيانات الشخصية ورقم الهاتف */}
        <Card className="lg:col-span-2 border shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              تعديل البيانات الأساسية ورقم الهاتف
            </CardTitle>
            <CardDescription>تحديث اسمك الثلاثي ورقم الواتساب للتواصل والشهادات</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم بالكامل</Label>
                  <Input 
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="اكتب اسمك الثلاثي لطباعته على الشهادات"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف أو الواتساب</Label>
                  <div className="relative">
                    <Input 
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="pr-9"
                    />
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'جاري حفظ البيانات...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* عمود أمان الحساب وبصمة الجهاز */}
        <Card className="border shadow-md h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              أمان الجهاز
            </CardTitle>
            <CardDescription>تفاصيل جهازك النشط حالياً في لوفيا</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">عنوان الـ IP الأخير:</span>
                <span className="font-mono font-medium">{(profile as any)?.last_ip_address || 'غير مسجل'}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <span className="text-muted-foreground block mb-1">بصمة المتصفح (Fingerprint):</span>
                <span className="font-mono text-xs text-primary block truncate bg-background p-1.5 rounded border">
                  {profile?.browser_fingerprint || 'لم يتم توليد بصمة بعد'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* قسم تغيير كلمة المرور الجديد بالكامل */}
        <Card className="lg:col-span-2 border shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور الخاصة بك
            </CardTitle>
            <CardDescription>تستطيع تعيين كلمة مرور جديدة قوية لحماية حسابك من الاختراق</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input 
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="6 أحرف أو أكثر"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="أعد كتابة كلمة المرور"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="destructive" disabled={isUpdatingPassword} className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {isUpdatingPassword ? 'جاري التحديث أمنياً...' : 'تحديث كلمة المرور'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* لوحة عرض الشهادات */}
        <Card className="lg:col-span-3 border shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              شهادات التقدير والنجاح 🎓
            </CardTitle>
            <CardDescription>الشهادات الصادرة لك بعد إتمام الكورسات</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p>لم تحصل على أي شهادات حتى الآن.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id} 
                    className="p-4 bg-gradient-to-br from-amber-50/40 to-background dark:from-amber-950/10 dark:to-background border-2 border-amber-200/60 dark:border-amber-900/40 rounded-xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base text-foreground line-clamp-1">
                          {cert.courses?.title_ar || 'شهادة إتمام كورس'}
                        </h4>
                        <Award className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {cert.description_ar || 'تم منح هذه الشهادة لإتمام متطلبات الدورة التعليمية بنجاح.'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3 mt-auto text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cert.issued_at).toLocaleDateString('ar-EG')}
                      </span>
                      <a 
                        href={`/verify-certificate/${cert.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        عرض وتنزيل <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}