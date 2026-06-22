import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithUsername, signInWithUsername } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. فحص تطابق كلمة المرور
    if (password !== confirmPassword) {
      setError(t('الباسووردات مش متطابقة', 'Passwords do not match'));
      return;
    }

    // 2. فحص طول كلمة المرور
    if (password.length < 6) {
      setError(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters'));
      return;
    }

    setLoading(true);

    try {
      // التعديل السحري: نمرر الـ username داخل الـ options.data عشان السيرفر يشوفه
      const { error: signUpError } = await signUpWithUsername(username, password, {
        data: { username: username, name: username }
      });
      
      if (signUpError) {
        const errMsg = signUpError.message?.toLowerCase() || '';
        
        if (errMsg.includes('unique constraint') || errMsg.includes('already exists')) {
          setError(t('اسم المستخدم ده موجود قبل كده، اختار اسم تاني', 'Username already exists'));
        } 
        else if (errMsg.includes('database error') || errMsg.includes('500') || errMsg.includes('saving new user')) {
          setError(t(
            'حصلت مشكلة في السيرفر أثناء حفظ البيانات، يرجى التواصل مع الإدارة', 
            'Database error saving user, please contact support'
          ));
        } 
        else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // تسجيل الدخول التلقائي
      await signInWithUsername(username, password);
      navigate('/');
    } catch (err: any) {
      const catchMsg = err.message?.toLowerCase() || '';
      
      if (catchMsg.includes('fetch') || catchMsg.includes('network')) {
        setError(t('مشكلة في الاتصال بالإنترنت، تحقق من شبكتك', 'Network error, please check your internet connection'));
      } else {
        setError(err.message || t('حدث خطأ غير متوقع', 'An unexpected error occurred'));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] relative overflow-hidden p-4 font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border-b-2 border-b-purple-500/20 relative">
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-14 h-14 bg-purple-500/5 rounded-xl flex items-center justify-center border border-purple-500/10 mx-auto mb-5 shadow-inner"
            >
              <UserPlus className="w-6 h-6 text-purple-400" />
            </motion.div>
            <div className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
              Luvia<span className="text-purple-500">.</span>
            </div>
            <CardTitle className="text-slate-200 text-lg font-bold">{t('إنشاء حساب جديد', 'Create Account')}</CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-1">
              {t('انضم إلينا اليوم وابدأ رحلتك التعليمية المتقدمة', 'Join us today and unlock advanced pathways')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/10 text-red-400 rounded-xl py-3 px-4">
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2 text-right rtl:text-right">
                <Label htmlFor="username" className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-2 flex-row-reverse justify-end">
                  <span>{t('اسم المستخدم', 'Username')}</span>
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </Label>
                <div className="relative group">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-slate-950/90 transition-all px-4"
                    placeholder="john_doe"
                  />
                </div>
              </div>

              <div className="space-y-2 text-right rtl:text-right">
                <Label htmlFor="password" className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-2 flex-row-reverse justify-end">
                  <span>{t('الباسوورد', 'Password')}</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-slate-950/90 transition-all px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2 text-right rtl:text-right">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-2 flex-row-reverse justify-end">
                  <span>{t('تأكيد الباسوورد', 'Confirm Password')}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                </Label>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 focus:bg-slate-950/90 transition-all px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-600/5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-4 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">{t('جاري الإنشاء...', 'Creating...')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{t('إنشاء حساب', 'Create Account')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </Button>

              <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-950/60 mt-4">
                {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline-offset-4 hover:underline transition-colors ml-1">
                  {t('تسجيل الدخول', 'Login')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}