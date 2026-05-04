import { Outlet, useLocation } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { ROUTES } from '@/routes';

export default function CareerLayout() {
  const location = useLocation();
  const onResumeBuilder = location.pathname.startsWith(ROUTES.admin.careerResume);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <header className="pt-2 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
            <Briefcase className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-light text-gray-900 dark:text-white">
              {onResumeBuilder ? 'Resume Builder' : 'Career'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
              {onResumeBuilder
                ? 'Profile bank, ATS-aware drafting, and AI-assisted tailoring.'
                : 'Hub for career tooling—starting with the résumé builder and room to grow.'}
            </p>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
