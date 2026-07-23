import { Outlet, useLocation } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';

const SUBMODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.admin.personalBrandingBrandIdentity]: {
    title: 'Brand Identity',
    subtitle: 'Global pillars, audience, tone metrics, and per-platform rules.',
  },
  [ROUTES.admin.personalBrandingWorkbench]: {
    title: 'Content Workbench',
    subtitle: 'Draft content and capture ideas from radar or AI prompts.',
  },
  [ROUTES.admin.personalBrandingPipeline]: {
    title: 'Content Pipeline',
    subtitle: 'Repurpose finalized content and track distribution.',
  },
  [ROUTES.admin.personalBrandingRadar]: {
    title: 'Signal Radar',
    subtitle: 'Inbound trend feed and scraper source management.',
  },
  [ROUTES.admin.personalBrandingRolodex]: {
    title: 'Rolodex',
    subtitle: 'Creator networking ledger and interaction tracking.',
  },
};

export default function PersonalBrandingLayout() {
  const location = useLocation();
  const match = Object.entries(SUBMODULE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  );
  const title = match?.[1].title ?? 'Personal Branding';
  const subtitle =
    match?.[1].subtitle ??
    'Identity, content creation, pipelining, signal scraping, and creator networking.';
  const isWorkbench = location.pathname.startsWith(ROUTES.admin.personalBrandingWorkbench);

  return (
    <PageContainer
      width={isWorkbench ? 'full' : 'default'}
      className={cn(
        isWorkbench
          ? 'flex h-[calc(100dvh-5rem)] flex-col overflow-hidden pb-0 lg:h-[calc(100dvh-2rem)] -mb-12'
          : 'pb-12'
      )}
    >
      <header className={cn('shrink-0 pb-6 pt-2', isWorkbench && 'pb-4')}>
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100/80 p-2 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            <Megaphone className="size-7" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-light text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm font-light text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </header>

      {isWorkbench ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      ) : (
        <Outlet />
      )}
    </PageContainer>
  );
}
