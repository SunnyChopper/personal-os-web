import { Link } from 'react-router-dom';

import { ROUTES } from '@/routes';

/** Placeholder linking to settings / future calendar OAuth UI. */
export function PlannerCalendarOverlay() {
  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3">
      <strong>Calendar</strong>: connect Google via{' '}
      <code className="text-[10px]">/integrations/calendars</code>. Busy/free blocks appear on planner
      days when synced.
      <div className="mt-2">
        <Link to={ROUTES.admin.settings} className="text-blue-600 dark:text-blue-400 hover:underline">
          Settings
        </Link>
      </div>
    </div>
  );
}
