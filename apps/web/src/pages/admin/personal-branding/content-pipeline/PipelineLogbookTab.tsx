import { cn } from '@/lib/utils';
import { PageCard, emptyStateCardClassName } from '../PersonalBrandingPageTemplate';

export default function PipelineLogbookTab() {
  return (
    <PageCard className={cn(emptyStateCardClassName, 'p-8 text-left')}>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Pipeline Logbook</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Distribution tracker with manual Mark as Posted verification will appear here.
      </p>
    </PageCard>
  );
}
