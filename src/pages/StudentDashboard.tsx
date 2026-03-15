import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserCourses } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play, GraduationCap, LayoutGrid } from 'lucide-react';
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
      <div className="min-h-screen bg-[#020617] p-8">
        <div className="container mx-auto">
          <Skeleton className="h-10 w-48 mb-8 bg-white/5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[400px] rounded-[2.5rem] bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-12 relative overflow-hidden">
      {/* تأثيرات النيون الخلفية */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -z-10" />
      
      <div className="container mx-auto px-4 pt-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              <h1 className="text-4xl font-black tracking-tight">
                {t('كورساتي المفعّلة', 'My Enrolled Courses')}
              </h1>
            </div>
            <p className="text-slate-400 text-lg ml-5">
              {t('تابع رحلة تعلمك من حيث توقفت', 'Continue your journey where you left off')}
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/courses')}
            variant="outline" 
            className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 px-6 gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            {t('تصفح الكورسات المتاحة', 'Browse More')}
          </Button>
        </motion.div>

        {courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl rounded-[3rem] py-20 text-center border-dashed border-2">
              <CardContent className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                  <GraduationCap className="h-12 w-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{t('مفيش كورسات لسه؟', 'No courses yet?')}</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  {t('ابدأ دلوقتي وفعل أول كورس ليك علشان تظهر محاضراتك هنا وتستعد للامتحانات', 'Redeem your first course voucher to see your lessons here and start preparing.')}
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate('/courses')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-10 h-14 rounded-2xl font-black shadow-lg shadow-blue-600/20"
                >
                  {t('استكشف الكورسات', 'Explore Courses')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((userCourse, index) => {
              const course = userCourse.courses;
              return (
                <motion.div
                  key={userCourse.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group bg-white/[0.03] border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                    <div className="relative h-52 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={language === 'ar' ? course.title_ar : course.title_en}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-slate-900 flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-blue-500/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />
                    </div>

                    <CardContent className="p-8">
                      <CardTitle className="text-2xl font-black mb-3 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {language === 'ar' ? course.title_ar : course.title_en}
                      </CardTitle>
                      
                      <CardDescription className="line-clamp-2 text-slate-400 text-sm mb-8 leading-relaxed h-10">
                        {language === 'ar' ? course.description_ar : course.description_en}
                      </CardDescription>

                      <Button
                        onClick={() => navigate(`/course/${course.id}/view`)}
                        className="w-full h-14 bg-white/5 hover:bg-blue-600 text-white hover:text-white border border-white/10 hover:border-blue-500 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 group/btn shadow-sm"
                      >
                        <Play className="w-5 h-5 fill-current group-hover/btn:animate-pulse" />
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