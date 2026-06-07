import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, ClipboardList, Video, BarChart } from 'lucide-react';
import InstructorCoursesPage from './instructor/InstructorCoursesPage';
import InstructorAssignmentsPage from './instructor/InstructorAssignmentsPage';
import InstructorProgressPage from './instructor/InstructorProgressPage';
import InstructorStudentsPage from './instructor/InstructorStudentsPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InstructorPanel() {
  const { t, language } = useLanguage();

  return (
    <div className="container py-8 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {t('لوحة تحكم المدرس', 'Instructor Panel')}
        </h1>
        <p className="text-muted-foreground">
          {t('إدارة الكورسات والدروس ومتابعة الطلاب', 'Manage courses, lessons, and track students')}
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t('الكورسات', 'Courses')}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('الواجبات', 'Assignments')}
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <BarChart className="h-4 w-4" />
            {t('التقدم', 'Progress')}
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            {t('الطلاب', 'Students')}
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Video className="h-4 w-4" />
            {t('المحاضرات المباشرة', 'Live Lectures')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <InstructorCoursesPage />
        </TabsContent>

        <TabsContent value="assignments">
          <InstructorAssignmentsPage />
        </TabsContent>

        <TabsContent value="progress">
          <InstructorProgressPage />
        </TabsContent>

        <TabsContent value="students">
          <InstructorStudentsPage />
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('المحاضرات المباشرة', 'Live Lectures')}</CardTitle>
              <CardDescription>
                {t('إدارة المحاضرات المباشرة', 'Manage live lectures')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('قريباً: المحاضرات المباشرة', 'Coming Soon: Live Lectures')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
