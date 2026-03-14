import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // إعادة التوجيه بناءً على دور المستخدم بعد تحميل الملف الشخصي
  // Redirect based on user role after profile loads
  useEffect(() => {
    if (profile) {
      const from = (location.state as any)?.from;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        // إعادة التوجيه الافتراضية بناءً على الدور
        // Default redirect based on role
        switch (profile.role) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'instructor':
            navigate('/instructor', { replace: true });
            break;
          case 'student':
            navigate('/student', { replace: true });
            break;
          case 'guest':
            navigate('/courses', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
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
    // لا حاجة للتنقل هنا، سيتم التعامل معه في useEffect
    // No need to navigate here, it will be handled in useEffect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl font-bold gradient-text mb-2">Luvia</div>
          <CardTitle>{t('تسجيل الدخول', 'Login')}</CardTitle>
          <CardDescription>
            {t('دخل اسم المستخدم والباسوورد للدخول', 'Enter your username and password to login')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{t('اسم المستخدم', 'Username')}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t('دخل اسم المستخدم', 'Enter username')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('الباسوورد', 'Password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('دخل الباسوورد', 'Enter password')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('جاري تسجيل الدخول...', 'Logging in...') : t('تسجيل الدخول', 'Login')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
              <Link to="/register" className="text-primary hover:underline">
                {t('إنشاء حساب', 'Register')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
