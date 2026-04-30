import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/Auth';
import Loader from '@/components/molecules/Loader';
import { ROUTES } from '@/routes';
import type { AppRole } from '@/lib/auth/auth.service';

interface RoleRouteProps {
  children: React.ReactNode;
  /** Only this app role may view the subtree. */
  allowRole: AppRole;
  /** Where to send users who don't match (e.g. spouse away from /admin). */
  redirectTo: string;
}

/**
 * After auth, enforce Household Sync role routing (owner vs spouse).
 * Unauthenticated users should be gated by ``ProtectedRoute`` first.
 */
export const RoleRoute = ({ children, allowRole, redirectTo }: RoleRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (!user) {
    return <Navigate to={ROUTES.admin.login} replace />;
  }

  const role = user.role ?? 'owner';
  if (role !== allowRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
