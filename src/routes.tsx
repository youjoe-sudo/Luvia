import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourseViewPage from './pages/StudentCourseViewPage';
import StudentCertificatesPage from './pages/StudentCertificatesPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import AdminPanel from './pages/AdminPanel';
import InstructorPanel from './pages/InstructorPanel';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
  },
  {
    name: 'Courses',
    path: '/courses',
    element: <HomePage />,
  },
  {
    name: 'Course Details',
    path: '/courses/:courseId',
    element: <CourseDetailsPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Register',
    path: '/register',
    element: <RegisterPage />,
  },
  {
    name: 'My Courses',
    path: '/my-courses',
    element: <StudentDashboard />,
  },
  {
    name: 'My Certificates',
    path: '/my-certificates',
    element: <StudentCertificatesPage />,
  },
  {
    name: 'Verify Certificate',
    path: '/verify-certificate',
    element: <VerifyCertificatePage />,
  },
  {
    name: 'Course View',
    path: '/course/:courseId/view',
    element: <StudentCourseViewPage />,
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    element: <AdminPanel />,
  },
  {
    name: 'Instructor Panel',
    path: '/instructor',
    element: <InstructorPanel />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
