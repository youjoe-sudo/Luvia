import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen flex items-center justify-center bg-[#030712] relative overflow-hidden p-4 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* --- BACKGROUND AMBIENT NEON GLOWS --- */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />
      
      {/* نقش إسلامي ناعم جداً ممتد مدمج مع الخلفية الداكنة */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border-b-2 border-b-blue-500/20 relative">
          
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-14 h-14 bg-blue-500/5 rounded-xl flex items-center justify-center border border-blue-500/10 mx-auto mb-5 shadow-inner"
            >
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </motion.div>
            
            <div className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
              Luvia<span className="text-blue-500">.</span>
            </div>
            
            <CardTitle className="text-slate-200 text-lg font-bold">{t('تسجيل الدخول', 'Login')}</CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-1">
              {t('مرحباً بك مجدداً في رحلتك التعليمية', 'Welcome back to your learning journey')}
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

              {/* Username Input Container */}
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
                    className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all px-4"
                    placeholder="john_doe"
                  />
                </div>
              </div>

              {/* Password Input Container */}
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
                    className="h-12 bg-slate-950/50 border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-950/90 transition-all px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-medium">{t('جاري الدخول...', 'Logging in...')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{t('تسجيل الدخول', 'Login')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </Button>

              {/* Bottom Navigation */}
              <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-950/60 mt-4">
                {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline transition-colors ml-1">
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