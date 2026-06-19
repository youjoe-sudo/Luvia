import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserCourses } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play, GraduationCap, LayoutGrid, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserCourses();
    }
  }, [user]);

  const loadUserCourses = async () => {
    try {
      const data = await getUserCourses(user!.id);
      setCourses(data);
    } catch (error) {
      console.error('Error loading user courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] p-6 sm:p-8 space-y-8 antialiased" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-9 w-52 mb-10 bg-slate-900/60 border border-slate-800/40 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[380px] rounded-3xl bg-slate-900/50 border border-slate-800/40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-16 relative overflow-hidden font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- BACKGROUND AMBIENT NEON GLOWS --- */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/5 blur-[130px] rounded-full pointer-events-none -z-10 animate-[pulse_10s_ease-in-out_infinite]" />

      <div className="container mx-auto px-4 pt-12 max-w-7xl relative z-10">
        
        {/* --- DASHBOARD HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-right rtl:text-right"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 justify-start">
              <div className="w-2 h-7 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t('كورساتي المفعّلة', 'My Enrolled Courses')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mr-5">
              {t('تابع رحلة تعلمك المتقدمة من حيث توقفت بكل سلاسة', 'Continue your expert learning journey seamlessly right where you left off')}
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/courses')}
            variant="outline" 
            className="rounded-xl border-slate-800 bg-slate-950/40 hover:bg-slate-900/80 text-slate-300 hover:text-white h-11 px-5 gap-2 backdrop-blur-md transition-all text-xs font-bold shrink-0 shadow-sm cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            {t('تصفح الكورسات المتاحة', 'Browse More')}
          </Button>
        </motion.div>

        {/* --- EMPTY STATE VIEW --- */}
        {courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="bg-slate-900/20 border-slate-800/80 backdrop-blur-xl rounded-3xl py-20 text-center border-dashed border-2 relative overflow-hidden max-w-3xl mx-auto shadow-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/[0.02] blur-3xl rounded-full pointer-events-none" />
              <CardContent className="flex flex-col items-center px-6 relative z-10">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
                  <GraduationCap className="h-7 w-7 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-200 mb-2">{t('مفيش كورسات لسه؟', 'No courses yet?')}</h2>
                <p className="text-xs text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  {t('ابدأ دلوقتي وفعل أول كورس ليك علشان تظهر محاضراتك هنا وتستعد للامتحانات', 'Redeem your first course voucher to see your lessons here and start preparing.')}
                </p>
                <Button 
                  size="default"
                  onClick={() => navigate('/courses')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 rounded-xl font-bold text-xs shadow-md shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t('استكشف الكورسات', 'Explore Courses')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* --- COURSES DISPLAY GRID --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            {courses.map((userCourse, index) => {
              const course = userCourse.courses;
              return (
                <motion.div
                  key={userCourse.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <Card className="group bg-slate-900/30 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden hover:border-blue-500/30 hover:bg-slate-900/70 transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col h-full relative">
                    
                    {/* Thumbnail Showcase Overlay */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950/40 shrink-0">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={language === 'ar' ? course.title_ar : course.title_en}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-slate-700/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/10 to-transparent opacity-80" />
                    </div>

                    {/* Content Body Container */}
                    <CardContent className="p-6 sm:p-7 flex-1 flex flex-col justify-between text-right rtl:text-right">
                      <div>
                        <CardTitle className="text-base font-bold mb-2 line-clamp-1 text-slate-200 group-hover:text-white transition-colors">
                          {language === 'ar' ? course.title_ar : course.title_en}
                        </CardTitle>
                        
                        <CardDescription className="line-clamp-2 text-slate-400 text-xs mb-6 leading-relaxed h-9 font-medium opacity-95">
                          {language === 'ar' ? course.description_ar : course.description_en}
                        </CardDescription>
                      </div>

                      <Button
                        onClick={() => navigate(`/course/${course.id}/view`)}
                        className="w-full h-11 bg-slate-950/40 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 group-hover:border-blue-500/40 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-inner active:scale-[0.98] mt-auto cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current opacity-90" />
                        {t('متابعة التعلم', 'Continue Learning')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}