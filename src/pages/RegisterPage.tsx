import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      setError(t('فشل إنشاء الحساب. اسم المستخدم قد يكون مستخدماً بالفعل (جرب تشيل المسافات والعلامات وخل وخلي الاسم كله بالانجليزي وخلي الحروف كلها Small)', 'Failed to create account. Username may already exist'));
      setLoading(false);
      return;
    }

    // Auto login after registration
    const { error: signInError } = await signInWithUsername(username, password);

    if (signInError) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl font-bold gradient-text mb-2">Luvia</div>
          <CardTitle>{t('إنشاء حساب جديد', 'Create Account')}</CardTitle>
          <CardDescription>
            {t('دخل بياناتك لإنشاء حساب جديد', 'Enter your details to create a new account')}
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
                placeholder={t('اختر اسم مستخدم', 'Choose a username')}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('تأكيد الباسوورد', 'Confirm Password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('دخل الباسوورد تاني', 'Re-enter password')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('جاري إنشاء الحساب...', 'Creating account...') : t('إنشاء حساب', 'Create Account')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('تسجيل الدخول', 'Login')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
