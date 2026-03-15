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
import { Globe, LogOut, User, BookOpen, LayoutDashboard, Award, Shield, ChevronDown } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // كلاسات لضمان وضوح الخط وتأثير النيون
  const neonTextPrimary = "text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)] font-black";
  const btnStyle = "font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/30 bg-[#050505]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        {/* اللوجو - ضخم وواضح */}
        <Link to="/" className="flex items-center">
          <span className={`text-3xl sm:text-4xl uppercase tracking-tighter ${neonTextPrimary}`}>
            Luvia
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          
          {/* الروابط الأساسية - تظهر في الشاشات المتوسطة وما فوق */}
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/courses">
              <Button variant="ghost" className={`${btnStyle} text-white hover:text-primary text-md`}>
                <BookOpen className="mr-2 h-5 w-5" />
                {t('الكورسات', 'Courses')}
              </Button>
            </Link>
            <Link to="/verify-certificate">
              <Button variant="ghost" className={`${btnStyle} text-white hover:text-secondary text-md`}>
                <Shield className="mr-2 h-5 w-5" />
                {t('التحقق', 'Verify')}
              </Button>
            </Link>
          </div>

          {/* تبديل اللغة */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/40 bg-transparent hover:bg-primary/10 rounded-full w-10 h-10">
                <Globe className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-primary/20 text-white shadow-2xl">
              <DropdownMenuItem onClick={() => setLanguage('ar')} className="font-bold hover:bg-primary/20 cursor-pointer">
                العربية {language === 'ar' && ' ✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')} className="font-bold hover:bg-primary/20 cursor-pointer">
                English {language === 'en' && ' ✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
<Button className={`bg-primary/10 border-2 border-primary/50 text-primary ${btnStyle} px-4 h-11`}>
  <User className="mr-2 h-5 w-5" />
  <span className="max-w-[120px] truncate text-md">
    {/* تحويل القيمة لنص صريح لمنع خطأ الـ Object */}
    {String(profile?.name || t('حسابي', 'Account'))}
  </span>
  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-primary/30 p-2 min-w-[220px] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                
                {/* خيارات الطالب */}
                {profile?.role === 'student' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/my-courses')} className="font-black py-4 text-white hover:text-primary text-lg border-b border-white/5">
                      <BookOpen className="mr-3 h-5 w-5 text-primary" /> {t('كورساتي', 'My Courses')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-certificates')} className="font-black py-4 text-white hover:text-secondary text-lg border-b border-white/5">
                      <Award className="mr-3 h-5 w-5 text-secondary" /> {t('شهاداتي', 'My Certificates')}
                    </DropdownMenuItem>
                  </>
                )}

                {/* لوحة الإدارة - مفعلة وواضحة جداً */}
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="font-black py-4 text-cyan-400 hover:bg-cyan-400/10 text-lg border-b border-white/5">
                    <LayoutDashboard className="mr-3 h-5 w-5" /> {t('لوحة الإدارة', 'Admin Panel')}
                  </DropdownMenuItem>
                )}

                {/* لوحة المدرس - مفعلة وواضحة جداً */}
                {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                  <DropdownMenuItem onClick={() => navigate('/instructor')} className="font-black py-4 text-purple-400 hover:bg-purple-400/10 text-lg border-b border-white/5">
                    <LayoutDashboard className="mr-3 h-5 w-5" /> {t('لوحة المدرس', 'Instructor Panel')}
                  </DropdownMenuItem>
                )}

                {/* تسجيل الخروج */}
                <DropdownMenuItem onClick={handleSignOut} className="font-black py-4 text-red-500 hover:bg-red-500/10 text-lg">
                  <LogOut className="mr-3 h-5 w-5" /> {t('تسجيل الخروج', 'Sign Out')}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className={`text-white border-2 border-white/10 hover:border-secondary hover:text-secondary h-11 ${btnStyle}`}
              >
                {t('دخول', 'Login')}
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className={`bg-primary text-black h-11 shadow-[0_0_20px_rgba(var(--primary),0.6)] hover:shadow-primary/90 text-md ${btnStyle}`}
              >
                {t('انضم الآن', 'Join Now')}
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}