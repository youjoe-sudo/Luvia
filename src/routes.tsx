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
import PlayLuvia from './pages/PlayLuvia';
import LuviaPad from './pages/LuviaPad';
import ContactUs from "./pages/Contact"; 
import type { ReactNode } from 'react';

// هنا ضفنا isAdmin عشان الـ TypeScript يوافق عليها
interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  isAdmin?: boolean; // الخاصية دي اختيارية (Optional)
  isInstructor?: boolean; // الخاصية دي اختيارية (Optional)
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
    name: 'Luvia Pad',
    path: '/luvia-pad',
    element: <LuviaPad />,
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
    isAdmin: true // دلوقتي الـ TypeScript مش هيطلع Error هنا
  },
  {
    name: 'Play Luvia',
    path: '/play',
    element: <PlayLuvia />,
  },
  {
    name: 'Instructor Panel',
    path: '/instructor',
    element: <InstructorPanel />,
    isInstructor: true // لو حابب تخليها بس للأدمن، أو ممكن تخليها isInstructor: true وتعدل الـ RouteGuard عشان يدعم كمان دور الـ Instructor
    // ممكن تضيف isAdmin: true هنا كمان لو حابب تحميها
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
  {
    name: 'Contact',
    path: '/contact',
    element: <ContactUs />,
  },
];

export default routes;