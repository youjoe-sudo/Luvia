import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserCourses } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-6 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('كورساتي', 'My Courses')}
        </h1>
        <p className="text-muted-foreground">
          {t('الكورسات التي قمت بتفعيلها', 'Courses you have activated')}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('ليس لديك أي كورسات بعد', "You don't have any courses yet")}
            </p>
            <Button onClick={() => navigate('/courses')}>
              {t('تصفح الكورسات', 'Browse Courses')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((userCourse) => {
            const course = userCourse.courses;
            return (
              <Card key={userCourse.id} className="hover:shadow-lg transition-shadow">
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
                  <CardDescription className="line-clamp-2 mb-4">
                    {language === 'ar' ? course.description_ar : course.description_en}
                  </CardDescription>
                  <Button
                    onClick={() => navigate(`/course/${course.id}/view`)}
                    className="w-full"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t('متابعة التعلم', 'Continue Learning')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
