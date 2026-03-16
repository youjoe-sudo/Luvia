import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, Sparkles, Zap, GraduationCap, ArrowRight, Terminal } from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => { loadCourses(); }, []);

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
    <div className="min-h-screen bg-[#020617] text-slate-50 overflow-x-hidden">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] md:text-xs font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('مستقبل التعليم الرقمي وصل', 'The Future of Learning is Here')}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
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

          {/* --- ACTION BUTTONS (MODERN GRID) --- */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center max-w-4xl mx-auto">
            
            {/* 1. Code Lab Button (Emerald Neon) */}
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
              {/* Scanline Effect */}
              <div className="absolute inset-0 w-full h-[2px] bg-emerald-500/20 top-[-100%] group-hover:top-[100%] transition-all duration-1000 ease-linear" />
            </button>

            {/* 2. Play Button (Blue Gradient) */}
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
                  <div className="relative bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl transition-all group-hover:border-blue-500/50">
                    
                    <div className="relative h-56 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-blue-500/20" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {course.price_usd ? `$${course.price_usd}` : 'FREE'}
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-grow text-right rtl:text-right">
                      <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                        {language === 'ar' ? course.title_ar : course.title_en}
                      </h3>
                      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-6 leading-relaxed">
                        {language === 'ar' ? course.description_ar : course.description_en}
                      </p>

                      <div className="mt-auto flex items-center justify-between flex-row-reverse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[1.5px]">
                            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center text-[9px] font-bold">
                               {course.instructor_name_ar?.slice(0, 1)}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-slate-300">
                             {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-all" />
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
      <footer className="py-20 text-center opacity-20">
        <p className="text-[10px] font-mono tracking-[0.4em] uppercase">Luvia Educational Matrix // {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}