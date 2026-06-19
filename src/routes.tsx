import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourseViewPage from './pages/StudentCourseViewPage';
import StudentCertificatesPage from './pages/StudentCertificatesPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import AdminPanel from './pages/AdminPanel';
import InstructorPanel from './pages/InstructorPanel';
import NotFound from './pages/NotFound';
import TransactionsHistory from './pages/TransactionsHistory';
import PlayLuvia from './pages/PlayLuvia';
import LuviaPad from './pages/LuviaPad';
import ContactUs from "./pages/Contact"; 
import ProfilePage from './pages/ProfilePage'; // الصفحات الجديدة اللي عملناها
import TransactionsPage from './pages/TransactionsPage'; // صفحة التحويلات والأكواد
import type { ReactNode } from 'react';
import TokenLinkPage from './pages/TokenLink';

// واجهة إعدادات المسار (Route Configuration Interface)
interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  isAdmin?: boolean; 
  isInstructor?: boolean; 
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
    name: 'Leaderboard',
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  {
    name: 'Transactions History',
    path: '/transactions-history',
    element: <TransactionsHistory />,
  },
  {
    name: 'TokenLink',
    path: '/tokens/:tokenId',
    element: <TokenLinkPage />,
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
    name: 'Profile',
    path: '/profile', // مسار صفحة البروفايل والأمان وتغيير الباسورد والفون
    element: <ProfilePage />,
  },
  {
    name: 'Transactions',
    path: '/transactions', // مسار صفحة الشحن وتفعيل أكواد الكورسات (Vouchers)
    element: <TransactionsPage />,
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    element: <AdminPanel />,
    isAdmin: true 
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
    isInstructor: true 
  },
  {
    name: 'Contact',
    path: '/contact',
    element: <ContactUs />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;