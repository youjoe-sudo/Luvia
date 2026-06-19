import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Zap, 
  GraduationCap, 
  ArrowRight, 
  Terminal, 
  Gift, 
  Video, 
  FileText, 
  Trophy,
  X 
} from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // التحكم في نافذة التحديثات الجديدة
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  useEffect(() => { 
    loadCourses(); 
    
    // فحص ما إذا كان المستخدم يفتح المنصة لأول مرة
    const hasSeenUpdates = localStorage.getItem('luvia_seen_updates_v1');
    if (!hasSeenUpdates) {
      setWhatsNewOpen(true);
      localStorage.setItem('luvia_seen_updates_v1', 'true');
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = courses.filter(course => {
        const title = language === 'ar' ? course.title_ar : course.title_en;
        const description = language === 'ar' ? course.description_ar : course.description_en;
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               description?.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchQuery, courses, language]);

  const loadCourses = async () => {
    try {
      const data = await getAllCourses(true);
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden relative font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- PREMIUM AMBIENT BACKGROUND GLOWS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 blur-[130px] rounded-full animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-[15%] w-[600px] h-[600px] bg-purple-600/5 blur-[160px] rounded-full" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 overflow-hidden z-10">
        <div className="container mx-auto text-center relative max-w-5xl">
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-inner text-slate-300 text-xs font-medium mb-8 transition-colors hover:border-slate-700/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-slate-400">{t('الجيل القادم من التعليم البرمجي والتقني والذكي', 'The Next Generation of Smart Tech Education')}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-50 via-white to-slate-400/40"
          >
            Luvia <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 bg-[length:200%_auto] animate-[shine_5s_linear_infinite]">Universe</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            {t('منصة تعليمية متقدمة تربط صانعي المحتوى بالمتعلمين بأحدث التقنيات الذكية والأدوات البرمجية المتكاملة في مكان واحد.', 'An advanced educational platform connecting creators with learners through smart technologies.')}
          </motion.p>

          {/* --- ULTRA MODERN ACTION BUTTONS --- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-4xl mx-auto px-4">
            
            <button
              onClick={() => navigate('/luvia-pad')}
              className="group relative w-full sm:w-52 px-4 py-3.5 bg-slate-950 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/10 hover:border-emerald-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 bg-emerald-400 blur-md" />
              <div className="relative z-20 flex items-center gap-3 justify-start">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[8px] font-mono tracking-wider text-emerald-400/60 uppercase font-bold">System: Active</span>
                  <span className="text-xs font-bold text-slate-200 transition-colors group-hover:text-white">{t('مختبر الأكواد', 'Code Lab')}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/play')}
              className="group relative w-full sm:w-52 px-4 py-3.5 bg-slate-950 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-blue-500/10 hover:border-blue-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 bg-blue-400 blur-md" />
              <div className="relative z-20 flex items-center gap-3 justify-start">
                <div className="w-9 h-9 rounded-lg bg-blue-500/5 flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500/10 transition-colors">
                  <Zap className="w-4 h-4 text-blue-400 transition-transform group-hover:scale-110" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[8px] font-mono tracking-wider text-blue-400/60 uppercase font-bold">Protocol: Arena</span>
                  <span className="text-xs font-bold text-slate-200 transition-colors group-hover:text-white">{t('العب مع Luvia', 'Play with Luvia')}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              className="group relative w-full sm:w-52 px-4 py-3.5 bg-slate-950 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-amber-500/10 hover:border-amber-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 bg-amber-400 blur-md" />
              <div className="relative z-20 flex items-center gap-3 justify-start">
                <div className="w-9 h-9 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10 group-hover:bg-amber-500/10 transition-colors">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[8px] font-mono tracking-wider text-amber-400/60 uppercase font-bold">Rank: Champions</span>
                  <span className="text-xs font-bold text-slate-200 transition-colors group-hover:text-white">{t('لوحة الشرف', 'Leaderboard')}</span>
                </div>
              </div>
            </button>

            {/* زر "إيه الجديد؟" الثابت */}
            <button
              onClick={() => setWhatsNewOpen(true)}
              className="group relative w-full sm:w-52 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(37,99,235,0.25)] cursor-pointer"
            >
              <div className="absolute inset-0 opacity-10 bg-white blur-md group-hover:opacity-20 transition-opacity" />
              <div className="relative z-20 flex items-center gap-3 justify-start">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Gift className="w-4 h-4 text-white animate-bounce" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[8px] font-mono tracking-wider text-blue-200 uppercase font-bold">Updates: Live</span>
                  <span className="text-xs font-bold text-white">{t('إيه الجديد؟ 🎁', 'What\'s New? 🎁')}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* --- COURSES SECTION --- */}
      <section className="container mx-auto px-4 sm:px-6 pb-28 relative z-10 max-w-7xl">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 border-b border-slate-900/60 pb-8">
          <div className="space-y-1.5 text-center md:text-right rtl:text-right">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                <GraduationCap className="text-blue-500 w-6 h-6" />
                {t('الكورسات المتاحة', 'Available Courses')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mr-1 md:mr-8">{t('اختر مسارك التعليمي المتقدم وابدأ رحلة التميز', 'Pick your path and start your journey')}</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              type="text"
              placeholder={t('ابحث عن شغفك التعليمي...', 'Search for your passion...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 bg-slate-900/30 border-slate-800/80 rounded-xl focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 focus:bg-slate-900/80 transition-all text-xs placeholder:text-slate-600 text-right rtl:text-right"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[380px] rounded-2xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence>
              {filteredCourses.map((course) => (
                <motion.div
                  layout
                  key={course.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="group relative cursor-pointer h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl" />
                  
                  <div className="relative bg-slate-900/20 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg hover:shadow-2xl hover:border-blue-500/20 transition-all duration-300">
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950/40 shrink-0">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="Course Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" />
                      ) : (
                        <div className="w-full h-full bg-slate-900/30 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-slate-800 group-hover:text-slate-700 transition-colors" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-md font-mono">
                        {course.price_usd ? `$${course.price_usd}` : t('مجاني', 'FREE')}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-60" />
                    </div>

                    <div className="p-6 flex flex-col flex-grow text-right rtl:text-right">
                      <h3 className="text-base font-bold text-slate-200 mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {language === 'ar' ? course.title_ar : course.title_en}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-6 leading-relaxed flex-grow font-medium opacity-90">
                        {language === 'ar' ? course.description_ar : course.description_en}
                      </p>

                      <div className="pt-4 border-t border-slate-950/60 flex items-center justify-between flex-row-reverse mt-auto">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <div className="w-7 h-7 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden shrink-0 font-sans">
                             {course.instructor_name_ar ? course.instructor_name_ar.slice(0, 1) : 'L'}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                             {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* --- 🛠️ استبدال الديالوج القديم بـ Framer Motion Custom Modal المضمون 100% --- */}
      {/* --- 🛠️ لوحة التحديثات والإضافات الأسطورية لـ Luvia Universe --- */}
      <AnimatePresence>
        {whatsNewOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            
            {/* الخلفية المعتمة (Overlay) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWhatsNewOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* جسم المودال */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md bg-slate-950 border border-slate-900 rounded-2xl p-6 text-right overflow-hidden shadow-2xl z-10 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* توهج خلفي نيون زرقا مريحة للعين */}
              <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

              {/* الهيدر */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5 flex-row-reverse">
                <button 
                  onClick={() => setWhatsNewOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5 flex-row-reverse">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    {t('ميزات لوفيا الجديدة وصلت! 🔥', 'New Luvia Features Are Here! 🔥')}
                  </h3>
                </div>
              </div>

              {/* المحتوى الفعلي المظبوط بناءً على ميزاتك */}
              <div className="space-y-4 my-2">
                
                {/* 1. الكود الفريد */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs font-bold text-slate-200">{t('الكود الفريد (Unique ID) 🎫', 'Unique User ID 🎫')}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('بقى ليك كود رقمي مميز وخاص بيك لوحدك، زي بصمتك جوة السيرفر وهو بوابتك لكل الميزات الجديدة والتحويلات.', 'Your unique digital identity on our server and the gateway to all new features.')}
                    </p>
                  </div>
                </div>

                {/* 2. نظام النقاط والبونص ولوحة الشرف */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 text-amber-500">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs font-bold text-slate-200">{t('محرك المكافآت ولوحة الشرف 👑', 'The Reward Engine & Leaderboard 👑')}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('جمع نقط من مشاهدة الفيديوهات (+5)، تقفيل الواجبات (+5)، وحتى محاولاتك وغلطك هيديك (+3)! نافس أصحابك واظهر في التوب 10 على المنصة.', 'Earn points for watching videos, finishing homework, or even trying! Race to hit the Top 10 Leaderboard.')}
                    </p>
                  </div>
                </div>

                {/* 3. محفظة التحويلات P2P */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs font-bold text-slate-200">{t('محفظة تحويل النقاط (P2P) 💸', 'P2P Points Transfer 💸')}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('تقدر دلوقتي تحول نقط من محفظتك لأي حد من أصحابك في ثواني، كل اللي محتاجه هو الكود الفريد بتاعه وعيش!', 'Transfer points directly from your wallet to your friends instantly using their Unique ID.')}
                    </p>
                  </div>
                </div>

                {/* 4. ميزات البروفايل VIP */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5 text-purple-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs font-bold text-slate-200">{t('ميزات البروفايل الـ VIP 💎', 'VIP Profile Features 💎')}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('اتدلع بنقطك! اشتري إطار ذهبي فخم لصورتك أو افتح الثيم السري المميز للموقع عشان تتباهى بيه وتتميز قدام زمايلك.', 'Spend your points to unlock premium golden avatar borders or exclusive luxury site themes.')}
                    </p>
                  </div>
                </div>

                {/* 5. عجلة الحظ اليومية */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5 text-red-400">
                    <Gift className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <h4 className="text-xs font-bold text-slate-200">{t('عجلة الحظ اليومية (Daily Spin) 🎁', 'Daily Lucky Spin 🎁')}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('ليك لفة مجانية كل 24 ساعة! افتح المنصة يومياً وجرب حظك عشان تكسب نقط عشوائية تزود بيها رصيدك مجاناً.', 'Spin the wheel for free every 24 hours to win random bonus points just for logging in.')}
                    </p>
                  </div>
                </div>

              </div>

              {/* زر الإغلاق الفخم */}
              <div className="pt-4 border-t border-slate-900 mt-5">
                <Button 
                  onClick={() => setWhatsNewOpen(false)}
                  className="w-full h-11 bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                >
                  {t('جاهز لتجربة الميزات الأسطورية! ⚡', 'Ready to Explore Luvia! ⚡')}
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FOOTER DECO --- */}
      <footer className="py-12 text-center border-t border-slate-900 relative z-10 bg-slate-950/10">
        <p className="text-[9px] font-mono tracking-[0.25em] text-slate-600 uppercase">Luvia Educational Matrix // {new Date().getFullYear()} // CORE INTERFACE</p>
      </footer>
    </div>
  );
}