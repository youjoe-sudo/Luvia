import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  isAdminRoute?: boolean; // ضفنا البروب ده هنا
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

export function RouteGuard({ children, isAdminRoute }: RouteGuardProps) {
  const { user, loading } = useAuth();
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

    // 2. القفلة اللي إنت محتاجها: لو بيحاول يدخل صفحة أدمن وهو مش أدمن
    if (isAdminRoute && user && user.role !== 'admin') {
      console.error("Access denied: Admin privileges required.");
      navigate('/', { replace: true }); // رجعه للرئيسية فوراً
    }
  }, [user, loading, location.pathname, navigate, isAdminRoute]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}