import { Navigate } from 'react-router-dom';
import { useMode } from '@/contexts/Mode';
import { ROUTES } from '@/routes';

export default function DashboardRedirect() {
  const { isLeisureMode } = useMode();

  return (
    <Navigate to={isLeisureMode ? ROUTES.admin.zenDashboard : ROUTES.admin.dashboard} replace />
  );
}
