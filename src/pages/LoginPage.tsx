import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion'; // ضفنا فريمير موشن للحركات الرايقة
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile) {
      const from = (location.state as any)?.from;
      if (from) {
        navigate(from, { replace: true });
      } else {
        switch (profile.role) {
          case 'admin': navigate('/admin', { replace: true }); break;
          case 'instructor': navigate('/instructor', { replace: true }); break;
          case 'student': navigate('/student', { replace: true }); break;
          case 'guest': navigate('/courses', { replace: true }); break;
          default: navigate('/', { replace: true });
        }
      }
    }
  }, [profile, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signInWithUsername(username, password);
    if (error) {
      setError(t('اسم المستخدم أو كلمة المرور غلط', 'Invalid username or password'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      {/* دوائر النيون في الخلفية */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 mx-auto mb-6"
            >
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div className="text-5xl font-black tracking-tighter text-white mb-2 drop-shadow-lg">
              Luvia<span className="text-blue-500">.</span>
            </div>
            <CardTitle className="text-slate-100 text-xl font-bold">{t('تسجيل الدخول', 'Login')}</CardTitle>
            <CardDescription className="text-slate-400">
              {t('مرحباً بك مجدداً في رحلتك التعليمية', 'Welcome back to your learning journey')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 ml-1 flex items-center gap-2">
                  <User className="w-4 h-4" /> {t('اسم المستخدم', 'Username')}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                  placeholder="john_doe"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-300 ml-1 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> {t('الباسوورد', 'Password')}
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('جاري الدخول...', 'Logging in...')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t('تسجيل الدخول', 'Login')}
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-slate-500 pt-2">
                {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-colors">
                  {t('إنشاء حساب جديد', 'Create Account')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}