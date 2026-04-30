import { NavLink, Outlet } from 'react-router-dom';
import { Ship } from 'lucide-react';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';

const tabs = [
  { to: ROUTES.admin.voyagerTrips, label: 'Trips' },
  { to: ROUTES.admin.voyagerMilestones, label: 'Milestones' },
  { to: ROUTES.admin.voyagerItinerary, label: 'Itinerary' },
];

export default function VoyagerLayout() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <header className="pt-2 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-teal-100/80 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200">
            <Ship className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-light text-gray-900 dark:text-white">
              Voyager
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
              Leisure travel planning — trips, quiet reminders, and gentle packing cues.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 mt-6" aria-label="Voyager sections">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors border',
                  isActive
                    ? 'bg-teal-600/15 border-teal-500/40 text-teal-900 dark:text-teal-100'
                    : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
