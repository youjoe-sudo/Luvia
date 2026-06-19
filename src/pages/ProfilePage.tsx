import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, getCertificatesByStudent } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Shield, Award, Calendar, ExternalLink, Save, Laptop, Lock, Phone } from 'lucide-react';

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
        if (!user) return;

        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setName(profileData.full_name || '');
          setPhone(profileData.phone_number || '');

          if (profileData.role === 'student') {
            const certs = await getCertificatesByStudent(profileData.id);
            setCertificates(certs || []);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الحساب');
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      await updateProfile(profile.id, {
        full_name: name,
        phone_number: phone,
      });
      
      setProfile(prev => prev ? { ...prev, full_name: name, phone_number: phone } : null);
      toast.success('تم تحديث البيانات الشخصية بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('فشل تحديث البيانات، حاول مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast.success('تم تغيير كلمة المرور بنجاح');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'فشل تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-xs tracking-wider uppercase">Loading User Instance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-20 relative overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- PREMIUM AMBIENT GLOWS --- */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 pt-12 max-w-6xl relative z-10">
        
        {/* --- HEADER PROFILE CARD --- */}
        <div className="mb-10">
          <Card className="bg-slate-900/20 border border-slate-800/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl relative border-b-2 border-b-blue-500/10">
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10" />
            
            <CardContent className="pt-14 pb-8 px-6 sm:px-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right rtl:sm:text-right gap-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shadow-inner group">
                <User className="h-10 w-10 transition-transform group-hover:scale-105" />
              </div>
              
              <div className="space-y-1.5 flex-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">{profile?.full_name || 'مستخدم غير مسمى'}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <Mail className="h-3.5 w-3.5 text-blue-400" /> {profile?.username}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-lg backdrop-blur-sm capitalize">
                    <Shield className="h-3.5 w-3.5 text-purple-400" /> {profile?.role || 'student'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- DUAL GRID PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
          
          {/* Card 1: Account Information */}
          <Card className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <CardHeader className="p-0 pb-5 border-b border-slate-950/80">
              <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2.5 flex-row-reverse justify-end">
                <span>البيانات الشخصية</span>
                <Laptop className="h-4 w-4 text-blue-400" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">تحديث اسمك ورقم الهاتف الخاص بك داخل المنصة</CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-2 text-right rtl:text-right">
                  <Label className="text-xs text-slate-400 mr-1">الاسم الكامل</Label>
                  <Input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-slate-950/40 border-slate-800 rounded-xl focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all text-sm text-slate-200 px-4"
                  />
                </div>

                <div className="space-y-2 text-right rtl:text-right">
                  <Label className="text-xs text-slate-400 mr-1">رقم الهاتف</Label>
                  <Input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="لا يوجد رقم هاتف مضاف"
                    className="h-11 bg-slate-950/40 border-slate-800 rounded-xl focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all text-sm text-slate-200 px-4"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Security & Credentials */}
          <Card className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <CardHeader className="p-0 pb-5 border-b border-slate-950/80">
              <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2.5 flex-row-reverse justify-end">
                <span>تغيير كلمة المرور</span>
                <Lock className="h-4 w-4 text-purple-400" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">تأمين حسابك عبر تعيين كلمة مرور جديدة قوية</CardDescription>
            </CardHeader>

            <CardContent className="p-0 pt-6">
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2 text-right rtl:text-right">
                  <Label className="text-xs text-slate-400 mr-1">كلمة المرور الجديدة</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-11 bg-slate-950/40 border-slate-800 rounded-xl focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-slate-950/90 transition-all text-sm text-slate-200 px-4"
                  />
                </div>

                <div className="space-y-2 text-right rtl:text-right">
                  <Label className="text-xs text-slate-400 mr-1">تأكيد كلمة المرور</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-11 bg-slate-950/40 border-slate-800 rounded-xl focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-slate-950/90 transition-all text-sm text-slate-200 px-4"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  {isUpdatingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* --- STUDENT CERTIFICATES SECTION --- */}
        <Card className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2.5 flex-row-reverse justify-end">
              <span>الشهادات المحرزة</span>
              <Award className="h-5 w-5 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">قائمة بالشهادات التي حصلت عليها بعد إتمام مساقاتك بنجاح</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {certificates.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-center p-6 opacity-[0.4]">
                <Award className="h-10 w-10 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">لا توجد شهادات متاحة حالياً، أكمل كورسك الأول لاستحقاقها!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id} 
                    className="group relative bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col h-full shadow-md hover:border-amber-500/20 hover:bg-slate-900/90 transition-all duration-300"
                  >
                    <div className="flex-grow text-right rtl:text-right">
                      <div className="flex items-center justify-between gap-3 mb-2 flex-row-reverse">
                        <h4 className="font-bold text-base text-slate-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {cert.courses?.title_ar || 'شهادة إتمام كورس'}
                        </h4>
                        <Award className="h-5 w-5 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                        {cert.description_ar || 'تم منح هذه الشهادة لإتمام متطلبات الدورة التعليمية بنجاح واجتياز كافة الاختبارات المقررة لها.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-950/60 pt-4 mt-auto text-[11px] text-slate-500 flex-row-reverse">
                      <span className="flex items-center gap-1 bg-slate-950/40 px-2 py-1 rounded border border-slate-900">
                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        {new Date(cert.issued_at).toLocaleDateString('ar-EG')}
                      </span>
                      
                      <a 
                        href={`/verify-certificate/${cert.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1.5 underline-offset-4 hover:underline transition-colors"
                      >
                        <span>عرض وتنزيل</span>
                        <ExternalLink className="h-3 w-3" />
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