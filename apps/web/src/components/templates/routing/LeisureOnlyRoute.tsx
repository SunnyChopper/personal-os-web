import { Navigate, Outlet } from 'react-router-dom';
import { useMode } from '@/contexts/Mode';
import { ROUTES } from '@/routes';

/** Blocks Work-mode access; deep links to Voyager redirect to the Zen dashboard. */
export default function LeisureOnlyRoute() {
  const { isLeisureMode } = useMode();
  if (!isLeisureMode) {
    return <Navigate to={ROUTES.admin.zenDashboard} replace />;
  }
  return <Outlet />;
}
