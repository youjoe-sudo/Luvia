import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllCourses } from '@/db/api';
import type { Course } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen } from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold gradient-text">
              Luvia
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('منصة تعليمية متقدمة تربط صانعي المحتوى بالمتعلمين', 'Advanced educational platform connecting content creators with learners')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/courses')}>
                <BookOpen className="mr-2 h-5 w-5" />
                {t('تصفح الكورسات', 'Browse Courses')}
              </Button>
              <Button 
  size="lg" 
  onClick={() => navigate('/contact')}
  className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 border-none px-8 py-6 rounded-xl font-bold uppercase tracking-widest text-xs"
>
  <svg 
    className="mr-2 h-5 w-5 animate-pulse" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
  {t('تواصل معنا', 'Contact Us')}
</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="container py-12">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="text-3xl font-bold">
              {t('الكورسات المتاحة', 'Available Courses')}
            </h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('ابحث عن كورس...', 'Search for a course...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-full bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('مفيش كورسات متاحة', 'No courses available')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                  <CardHeader>
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={language === 'ar' ? course.title_ar : course.title_en}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-md flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-primary" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2">
                      {language === 'ar' ? course.title_ar : course.title_en}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {language === 'ar' ? course.description_ar : course.description_en}
                    </CardDescription>
                    {course.instructor_name_ar && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('المحاضر:', 'Instructor:')} {language === 'ar' ? course.instructor_name_ar : course.instructor_name_en}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    {course.price_usd && (
                      <span className="text-lg font-bold text-primary">
                        ${course.price_usd}
                      </span>
                    )}
                    <Button variant="outline">
                      {t('عرض التفاصيل', 'View Details')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
