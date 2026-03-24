import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  isAdminRoute?: boolean;
  isInstructorRoute?: boolean;
}

const PUBLIC_ROUTES = ['/login', '/register', '/403', '/404', '/', '/courses', '/courses/*'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children, isAdminRoute, isInstructorRoute }: RouteGuardProps) {
  const { user, profile, loading } = useAuth(); // استخراج الـ profile
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // 1. لو مش مسجل دخول وبيحاول يدخل صفحة مش عامة
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // 2. حماية صفحة الأدمن
    if (isAdminRoute && profile && profile.role !== 'admin') {
      console.error("Access denied: Admin only.");
      navigate('/', { replace: true });
      return;
    }

    // 3. حماية صفحة المحاضر (الأدمن مسموح له يدخلها برضه)
    if (isInstructorRoute && profile && profile.role !== 'instructor' && profile.role !== 'admin') {
      console.error("Access denied: Instructor only.");
      navigate('/', { replace: true });
      return;
    }

  }, [user, profile, loading, location.pathname, navigate, isAdminRoute, isInstructorRoute]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}