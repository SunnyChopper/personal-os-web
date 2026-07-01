import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PlatformRepurposerSkeleton,
  SingleColumnSkeleton,
  TableSkeleton,
  TwoColumnSkeleton,
} from '@/components/molecules/LayoutSkeletons';
import { tabActiveClassName, tabInactiveClassName } from './personal-branding-ui';

export interface SubModuleTab {
  id: string;
  label: string;
}

export type SubModuleSkeletonLayout =
  | 'two-column'
  | 'single-column'
  | 'table'
  | 'platform-repurposer';

interface SubModuleTabShellProps {
  tabs: readonly SubModuleTab[];
  defaultTabId: string;
  ariaLabel: string;
  isLoading?: boolean;
  skeletonLayout?: SubModuleSkeletonLayout;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  renderPanel: (activeTabId: string) => ReactNode;
}

function renderSkeletonLayout(layout: SubModuleSkeletonLayout) {
  switch (layout) {
    case 'two-column':
      return <TwoColumnSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'platform-repurposer':
      return <PlatformRepurposerSkeleton />;
    case 'single-column':
    default:
      return <SingleColumnSkeleton />;
  }
}

export default function SubModuleTabShell({
  tabs,
  defaultTabId,
  ariaLabel,
  isLoading = false,
  skeletonLayout = 'single-column',
  activeTabId,
  onTabChange,
  renderPanel,
}: SubModuleTabShellProps) {
  const [internalTab, setInternalTab] = useState(defaultTabId);
  const activeTab = activeTabId ?? internalTab;

  const handleTabChange = (tabId: string) => {
    if (isLoading) return;
    if (onTabChange) onTabChange(tabId);
    else setInternalTab(tabId);
  };

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={isLoading}
            disabled={isLoading}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              activeTab === tab.id ? tabActiveClassName : tabInactiveClassName,
              isLoading && 'cursor-not-allowed opacity-70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-busy={isLoading}>
        {isLoading ? renderSkeletonLayout(skeletonLayout) : renderPanel(activeTab)}
      </div>
    </div>
  );
}
