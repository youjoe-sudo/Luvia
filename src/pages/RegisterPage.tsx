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

    if (password !== confirmPassword) {
      setError(t('الباسووردات مش متطابقة', 'Passwords do not match'));
      return;
    }

    if (password.length < 6) {
      setError(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters'));
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUpWithUsername(username, password);

    if (signUpError) {
      setError(t('فشل إنشاء الحساب. اسم المستخدم قد يكون مستخدماً بالفعل (جرب تشيل المسافات والعلامات وخلي الاسم كله بالانجليزي حروف صغيرة)', 'Username may already exist or invalid format'));
      setLoading(false);
      return;
    }

    const { error: signInError } = await signInWithUsername(username, password);
    if (signInError) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      {/* دوائر النيون الخلفية - نفس ستايل اللوجن */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30 mx-auto mb-6"
            >
              <UserPlus className="w-8 h-8 text-purple-400" />
            </motion.div>
            <div className="text-5xl font-black tracking-tighter text-white mb-2">
              Luvia<span className="text-purple-500">.</span>
            </div>
            <CardTitle className="text-slate-100 text-xl font-bold">{t('إنشاء حساب جديد', 'Create Account')}</CardTitle>
            <CardDescription className="text-slate-400">
              {t('ابدأ رحلتك التعليمية معنا اليوم', 'Start your learning journey with us today')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl">
                    <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
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
                  className="h-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                  placeholder="username_123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 ml-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> {t('الباسوورد', 'Password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 ml-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> {t('تأكيد الباسوورد', 'Confirm Password')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    {t('جاري الإنشاء...', 'Creating...')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t('إنشاء حساب', 'Create Account')}
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-slate-500 pt-2">
                {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold underline-offset-4 hover:underline transition-colors">
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