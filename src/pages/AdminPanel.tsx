import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Ticket, Users, FileText, ClipboardList, Clock, Award, Shield } from 'lucide-react';
import AdminCoursesPage from './admin/AdminCoursesPage';
import AdminLessonsPage from './admin/AdminLessonsPage';
import AdminVouchersPage from './admin/AdminVouchersPage';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminAssignmentsPage from './admin/AdminAssignmentsPage';
import AdminLessonProgressPage from './admin/AdminLessonProgressPage';
import AdminCertificatesPage from './admin/AdminCertificatesPage';
import AdminDeviceAttemptsPage from './admin/AdminDeviceAttemptsPage';

export default function AdminPanel() {
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('لوحة الإدارة', 'Admin Panel')}
        </h1>
        <p className="text-muted-foreground">
          {t('إدارة المنصة والكورسات والمستخدمين', 'Manage platform, courses, and users')}
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t('الكورسات', 'Courses')}
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('الدروس', 'Lessons')}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('الواجبات', 'Assignments')}
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <Clock className="h-4 w-4" />
            {t('التقدم', 'Progress')}
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" />
            {t('الشهادات', 'Certificates')}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="gap-2">
            <Ticket className="h-4 w-4" />
            {t('الأكواد', 'Vouchers')}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            {t('المستخدمون', 'Users')}
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('الأجهزة', 'Devices')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <AdminCoursesPage />
        </TabsContent>

        <TabsContent value="lessons">
          <AdminLessonsPage />
        </TabsContent>

        <TabsContent value="assignments">
          <AdminAssignmentsPage />
        </TabsContent>

        <TabsContent value="progress">
          <AdminLessonProgressPage />
        </TabsContent>

        <TabsContent value="certificates">
          <AdminCertificatesPage />
        </TabsContent>

        <TabsContent value="vouchers">
          <AdminVouchersPage />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersPage />
        </TabsContent>

        <TabsContent value="devices">
          <AdminDeviceAttemptsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
