import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/Auth';
import Loader from '@/components/molecules/Loader';
import { isAdminLoginPath, ROUTES } from '@/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (!user) {
    if (!isAdminLoginPath(location.pathname)) {
      return <Navigate to={ROUTES.admin.login} replace />;
    }
    return null;
  }

  return <>{children}</>;
};
