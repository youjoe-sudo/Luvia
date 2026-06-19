import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Globe, LogOut, User, BookOpen, LayoutDashboard, 
  Award, Shield, ChevronDown, ArrowRightLeft, Sun, Moon, Sparkles, LogIn, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // كلاسات الألوان والتوهج السيبراني النظيف للمنصة
  const neonTextPrimary = "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-blue-500 font-black tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]";
  
  return (
    <>
      {/* ========================================================================= */}
      {/* --- DESKTOP & GLOBAL HEADER --- */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900/80 bg-[#030712]/80 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          
          {/* الجانب الأيمن: اللوجو النيوني الفاخر */}
          <Link to="/" className="flex items-center gap-2 group select-none">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center"
            >
              <span className={`text-2xl sm:text-3xl uppercase ${neonTextPrimary}`}>
                Luvia
              </span>
              <Sparkles className="w-4 h-4 text-blue-400 ml-1.5 opacity-70 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
            </motion.div>
          </Link>

          {/* المنتصف: روابط التصفح الأساسية للكمبيوتر (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/40 border border-slate-900 px-2 py-1.5 rounded-full backdrop-blur-md">
            <Link to="/courses">
              <Button 
                variant="ghost" 
                className={`h-9 px-5 rounded-full text-xs font-bold transition-all duration-200 ${location.pathname === '/courses' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                <BookOpen className="ml-1.5 h-3.5 w-3.5" />
                {t('الكورسات', 'Courses')}
              </Button>
            </Link>
            <Link to="/verify-certificate">
              <Button 
                variant="ghost" 
                className={`h-9 px-5 rounded-full text-xs font-bold transition-all duration-200 ${location.pathname === '/verify-certificate' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                <Shield className="ml-1.5 h-3.5 w-3.5" />
                {t('التحقق من الشهادات', 'Verify')}
              </Button>
            </Link>
          </nav>

          {/* الجانب الأيسر: عناصر التحكم والحساب */}
          <div className="flex items-center gap-2.5">
            
            {/* 1. زر تبديل الثيم المطور */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="border-slate-800/80 bg-slate-950/40 hover:bg-slate-900 rounded-xl w-10 h-10 transition-all shadow-sm"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-400" />
                )}
              </Button>
            </motion.div>

            {/* 2. زر تبديل اللغة كبسولي متفاعل */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900 rounded-xl w-10 h-10 flex items-center justify-center transition-all cursor-pointer shadow-sm">
                  <Globe className="h-4 w-4 text-blue-400" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-950/95 border-slate-900 text-slate-200 shadow-2xl backdrop-blur-md rounded-xl p-1 min-w-[120px]">
                <DropdownMenuItem onClick={() => setLanguage('ar')} className="font-bold text-xs hover:bg-blue-600/10 hover:text-blue-400 cursor-pointer rounded-lg py-2 px-3 text-right">
                  العربية {language === 'ar' && ' ✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="font-bold text-xs hover:bg-blue-600/10 hover:text-blue-400 cursor-pointer rounded-lg py-2 px-3">
                  English {language === 'en' && ' ✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. قطاع الملف الشخصي وتسجيل الدخول للـ Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button whileHover={{ scale: 1.02 }} className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-4 h-10 rounded-xl flex items-center gap-2 shadow-md cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[9px] font-black font-mono text-blue-400 uppercase">
                        {String(profile?.name || 'U').slice(0, 1)}
                      </div>
                      <span className="max-w-[110px] truncate text-xs font-bold tracking-wide">
                        {String(profile?.name || t('حسابي', 'Account'))}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="bg-slate-950/95 border-slate-900 p-2 min-w-[240px] shadow-2xl backdrop-blur-md rounded-xl text-right rtl:text-right">
                    
                    {/* لوحة الإدارة (تظهر للأدمن فقط) */}
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="font-bold py-2.5 text-xs text-cyan-400 hover:bg-cyan-500/5 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                        <LayoutDashboard className="h-4 w-4" /> {t('لوحة الإدارة', 'Admin Panel')}
                      </DropdownMenuItem>
                    )}

                    {/* لوحة المدرس (تظهر للمدرس أو الأدمن) */}
                    {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                      <DropdownMenuItem onClick={() => navigate('/instructor')} className="font-bold py-2.5 text-xs text-purple-400 hover:bg-purple-500/5 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                        <LayoutDashboard className="h-4 w-4" /> {t('لوحة المدرس', 'Instructor Panel')}
                      </DropdownMenuItem>
                    )}

                    {/* روابط الكورسات المفعّلة */}
                    <DropdownMenuItem onClick={() => navigate('/my-courses')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 hover:text-blue-400 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                      <BookOpen className="h-4 w-4 text-blue-500" /> {t('كورساتي المفعّلة', 'My Courses')}
                    </DropdownMenuItem>

                    {/* شحن الأكواد (متاح لكل المستخدمين الآن بحسب رغبتك) */}
                    <DropdownMenuItem onClick={() => navigate('/transactions')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 hover:text-blue-400 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                      <ArrowRightLeft className="h-4 w-4 text-blue-500" /> {t('تحويل النقاط', 'Transfare Points')}
                    </DropdownMenuItem>
                    
                    {/* لوحة الشهادات (متاحة لكل المستخدمين الآن) */}
                    <DropdownMenuItem onClick={() => navigate('/my-certificates')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-indigo-500/5 hover:text-indigo-400 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                      <Award className="h-4 w-4 text-indigo-500" /> {t('شهادات النجاح', 'My Certificates')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-900" />

                    {/* الملف الشخصي والأمان (متاح لكل المستخدمين) */}
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 hover:text-blue-400 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                      <User className="h-4 w-4 text-blue-500" /> {t('إعدادات الحساب والأمان', 'Profile Settings')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-900" />

                    {/* تسجيل الخروج */}
                    <DropdownMenuItem onClick={handleSignOut} className="font-bold py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer flex items-center gap-2 flex-row-reverse justify-end">
                      <LogOut className="h-4 w-4" /> {t('تسجيل الخروج', 'Sign Out')}
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* إذا لم يكن مسجلاً دخول (Desktop الأزرار الفخمة النظيفة) */
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')} 
                    className="text-slate-400 hover:text-white text-xs font-bold h-10 px-4 rounded-xl"
                  >
                    {t('دخول', 'Login')}
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-600/10 text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {t('انضم الآن', 'Join Now')}
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* --- FLOATING PREMIUM BOTTOM INTERACTIVE DOCK (MOBILE ONLY) --- */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md block lg:hidden font-sans">
        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-slate-800/80 p-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center justify-around relative">
          
          {/* رابط الكورسات الأساسي */}
          <button 
            onClick={() => navigate('/courses')}
            className={`flex flex-col items-center gap-1 p-2 transition-transform active:scale-90 cursor-pointer ${location.pathname === '/courses' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('الكورسات', 'Courses')}</span>
          </button>

          {/* رابط فحص الشهادات */}
          <button 
            onClick={() => navigate('/verify-certificate')}
            className={`flex flex-col items-center gap-1 p-2 transition-transform active:scale-90 cursor-pointer ${location.pathname === '/verify-certificate' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('التحقق', 'Verify')}</span>
          </button>

          {/* زر البروفايل أو القائمة الشاملة المتفاعلة للموبايل */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center gap-1 p-2 transition-transform active:scale-90 text-slate-500 hover:text-slate-300 cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[8px] font-black text-blue-400 uppercase">
                    {String(profile?.name || 'U').slice(0, 1)}
                  </div>
                  <span className="text-[9px] font-bold max-w-[50px] truncate">{String(profile?.name || t('حسابي', 'Me'))}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" sideOffset={14} className="bg-slate-950/95 border-slate-900 p-2 min-w-[220px] shadow-2xl backdrop-blur-md rounded-xl text-right rtl:text-right">
                
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="font-bold py-2.5 text-xs text-cyan-400 hover:bg-cyan-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                    <LayoutDashboard className="h-4 w-4" /> {t('لوحة الإدارة', 'Admin Panel')}
                  </DropdownMenuItem>
                )}
                
                {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                  <DropdownMenuItem onClick={() => navigate('/instructor')} className="font-bold py-2.5 text-xs text-purple-400 hover:bg-purple-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                    <LayoutDashboard className="h-4 w-4" /> {t('لوحة المدرس', 'Instructor Panel')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => navigate('/my-courses')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                  <BookOpen className="h-4 w-4 text-blue-500" /> {t('كورساتي المفعّلة', 'My Courses')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/transactions')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" /> {t('تحويل النقاط', 'Vouchers')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/my-certificates')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                  <Award className="h-4 w-4 text-indigo-500" /> {t('شهاداتي', 'Certificates')}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/profile')} className="font-bold py-2.5 text-xs text-slate-300 hover:bg-blue-500/5 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                  <User className="h-4 w-4 text-blue-500" /> {t('إعدادات البروفايل', 'Profile')}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-900" />
                <DropdownMenuItem onClick={handleSignOut} className="font-bold py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 flex-row-reverse justify-end">
                  <LogOut className="h-4 w-4" /> {t('تسجيل الخروج', 'Sign Out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* زر الدخول السريع للموبايل إذا لم يكن مسجلاً */
            <button 
              onClick={() => navigate('/login')}
              className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-blue-500" />
              <span className="text-[9px] font-bold">{t('دخول', 'Login')}</span>
            </button>
          )}

        </div>
      </div>
    </>
  );
}