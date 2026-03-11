import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, LogOut, User, BookOpen, LayoutDashboard, Award, Shield } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-3xl font-bold gradient-text">Luvia</div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/courses">
            <Button variant="ghost" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('الكورسات', 'Courses')}
            </Button>
          </Link>

          <Link to="/verify-certificate">
            <Button variant="ghost" className="gap-2">
              <Shield className="h-4 w-4" />
              {t('التحقق من الشهادة', 'Verify Certificate')}
            </Button>
          </Link>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('ar')}>
                العربية {language === 'ar' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English {language === 'en' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {String(profile?.name || t('حسابي', 'My Account'))}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile?.role === 'student' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/my-courses')} className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t('كورساتي', 'My Courses')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-certificates')} className="gap-2">
                      <Award className="h-4 w-4" />
                      {t('شهاداتي', 'My Certificates')}
                    </DropdownMenuItem>
                  </>
                )}
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('لوحة الإدارة', 'Admin Panel')}
                  </DropdownMenuItem>
                )}
                {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                  <DropdownMenuItem onClick={() => navigate('/instructor')} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('لوحة المدرس', 'Instructor Panel')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  {t('تسجيل الخروج', 'Sign Out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/login')}>
                {t('تسجيل الدخول', 'Login')}
              </Button>
              <Button onClick={() => navigate('/register')}>
                {t('إنشاء حساب', 'Register')}
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
