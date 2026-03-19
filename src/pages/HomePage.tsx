import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, Sparkles, Zap, GraduationCap, ArrowRight, Terminal, Moon, Star, X } from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEidModal, setShowEidModal] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => { 
    loadCourses(); 
    // التأكد من ظهور نافذة التهنئة مرة واحدة
    const hasSeenEid = localStorage.getItem('eid_2026_seen');
    if (!hasSeenEid) {
      setTimeout(() => setShowEidModal(true), 1500);
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
    <div className="min-h-screen bg-[#020617] text-slate-50 overflow-x-hidden relative">
      
      {/* 🌙 --- زينة العيد العملاقة (Hanging Decorations) --- */}
      <div className="absolute inset-x-0 top-0 h-96 pointer-events-none z-50 overflow-hidden">
        {/* هلال ونجمة يمين */}
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [-2, 2, -2] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute right-6 md:right-20 top-0 flex flex-col items-center origin-top"
        >
          <div className="w-[1px] h-32 md:h-48 bg-gradient-to-b from-transparent via-yellow-500/20 to-yellow-500/50" />
          <Moon className="w-12 h-12 md:w-24 md:h-24 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_25px_rgba(250,204,21,0.5)]" />
        </motion.div>

        {/* نجوم متدلية متوزعة (مخصصة للموبايل والويب) */}
        {[15, 30, 50, 70, 85].map((pos, i) => (
          <motion.div 
            key={i} 
            animate={{ y: [0, 20, 0] }} 
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} 
            style={{ left: `${pos}%` }} 
            className="absolute top-0 flex flex-col items-center opacity-30 md:opacity-80"
          >
            <div className={`w-[0.5px] bg-gradient-to-b from-transparent to-white/20 ${i % 2 === 0 ? 'h-24' : 'h-40'}`} />
            <Star className="w-4 h-4 text-white fill-white/20" />
          </motion.div>
        ))}

        {/* هلال يسار */}
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [2, -2, 2] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute left-6 md:left-40 top-0 flex flex-col items-center origin-top"
        >
          <div className="w-[1px] h-40 md:h-60 bg-gradient-to-b from-transparent via-blue-500/20 to-blue-500/40" />
          <Moon className="w-10 h-10 md:w-16 md:h-16 text-blue-400 fill-blue-400/10 rotate-45" />
        </motion.div>
      </div>

      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
        {/* نقش إسلامي خفيف */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] pointer-events-none" />
      </div>

      {/* 🎆 --- EID GREETING MODAL --- */}
      <AnimatePresence>
        {showEidModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEidModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f172a] border border-yellow-500/30 rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.15)] text-center"
            >
              <div className="relative z-10 space-y-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="mx-auto w-24 h-24 rounded-full border border-dashed border-yellow-500/40 flex items-center justify-center">
                   <Moon className="w-12 h-12 text-yellow-500 fill-yellow-500/20" />
                </motion.div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter">EID MUBARAK</h2>
                <p className="text-yellow-500 font-bold text-xl">كل عام وأنتم بخير</p>
                <p className="text-slate-400 leading-relaxed">بمناسبة العيد، استمتع برحلة تعليمية مميزة مع أحدث الكورسات والتقنيات في Luvia Universe.</p>
                <Button 
                  onClick={() => { localStorage.setItem('eid_2026_seen', 'true'); setShowEidModal(false); }}
                  className="w-full h-16 bg-yellow-600 hover:bg-yellow-500 text-white font-black rounded-2xl shadow-lg shadow-yellow-900/40 transition-all"
                >
                  {t('استكشف عيدية Luvia', 'Explore Eid Gift')} 🌙
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-20 px-6 overflow-hidden z-10">
        <div className="container mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] md:text-xs font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('مستقبل التعليم الرقمي وصل - إصدار العيد', 'The Future of Learning is Here - Eid Edition')}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-yellow-500/30"
          >
            Luvia <span className="text-blue-500">Universe</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('منصة تعليمية متقدمة تربط صانعي المحتوى بالمتعلمين بأحدث التقنيات الذكية', 'An advanced educational platform connecting creators with learners through smart technologies.')}
          </motion.p>

          {/* --- ACTION BUTTONS --- */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center max-w-4xl mx-auto">
            {/* 1. Code Lab Button */}
            <button
              onClick={() => navigate('/luvia-pad')}
              className="group relative w-full sm:w-64 px-6 py-4 bg-[#0f172a] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-900/20 border border-emerald-500/20"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-emerald-500 blur-xl" />
              <div className="relative z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[7px] font-mono tracking-[0.3em] text-emerald-500 uppercase font-bold">System: Active</span>
                  <span className="text-sm md:text-base font-black text-white italic">{t('مختبر الأكواد', 'Code Lab')}</span>
                </div>
              </div>
              <div className="absolute inset-0 w-full h-[2px] bg-emerald-500/20 top-[-100%] group-hover:top-[100%] transition-all duration-1000 ease-linear" />
            </button>

            {/* 2. Play Button */}
            <button
              onClick={() => navigate('/play')}
              className="group relative w-full sm:w-64 px-6 py-4 bg-[#0f172a] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-900/20 border border-blue-500/20"
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#3b82f6)] animate-[spin_6s_linear_infinite]" />
              </div>
              <div className="absolute inset-[1.5px] bg-[#020617]/90 backdrop-blur-2xl rounded-[15px] z-10" />
              <div className="relative z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
                </div>
                <div className="flex flex-col items-start text-left rtl:text-right">
                  <span className="text-[7px] font-mono tracking-[0.3em] text-blue-500 uppercase font-bold">Protocol: Play</span>
                  <span className="text-sm md:text-base font-black text-white italic">{t('العب مع Luvia', 'Play with Luvia')}</span>
                </div>
              </div>
            </button>

            {/* 3. Explore Courses Button */}
            <Button 
              size="lg" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/courses');
              }}
              className="relative z-50 w-full sm:w-auto px-8 py-7 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-sm md:text-base font-bold group cursor-pointer"
            >
              <BookOpen className="mr-3 w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform text-slate-400" />
              {t('تصفح الكورسات', 'Explore Courses')}
            </Button>
          </div>
        </div>
      </section>

      {/* --- COURSES GRID --- */}
      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-16">
          <div className="space-y-2 text-center md:text-right rtl:text-right">
            <h2 className="text-3xl md:text-4xl font-black flex items-center gap-3 justify-center md:justify-start">
              <GraduationCap className="text-blue-500 w-8 h-8 md:w-10 md:h-10" />
              {t('الكورسات المتاحة', 'Available Courses')}
            </h2>
            <p className="text-sm md:text-base text-slate-400">{t('اختر مسارك التعليمي وابدأ رحلة النجاح', 'Pick your path and start your journey')}</p>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              type="text"
              placeholder={t('ابحث عن شغفك...', 'Search for your passion...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-md text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[450px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredCourses.map((course) => (
                <motion.div
                  layout
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10 }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="group relative cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity rounded-[2.5rem]" />
                  <div className="relative bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl transition-all group-hover:border-yellow-500/40">
                    
                    <div className="relative h-56 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-blue-500/20" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-yellow-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {course.price_usd ? `$${course.price_usd}` : 'FREE'}
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-grow text-right rtl:text-right">
                      <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-yellow-500 transition-colors">
                        {language === 'ar' ? course.title_ar : course.title_en}
                      </h3>
                      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-6 leading-relaxed">
                        {language === 'ar' ? course.description_ar : course.description_en}
                      </p>

                      <div className="mt-auto flex items-center justify-between flex-row-reverse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 p-[1.5px]">
                            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center text-[9px] font-bold text-yellow-500">
                               {course.instructor_name_ar?.slice(0, 1)}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-slate-300">
                             {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-500 group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* --- FOOTER DECO --- */}
      <footer className="py-20 text-center opacity-40">
        <div className="flex justify-center gap-4 mb-4 text-yellow-500/20">
          <Moon className="w-4 h-4" />
          <Star className="w-4 h-4" />
          <Moon className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-mono tracking-[0.4em] uppercase">Luvia Educational Matrix // {new Date().getFullYear()} // EID EDITION</p>
      </footer>
    </div>
  );
}