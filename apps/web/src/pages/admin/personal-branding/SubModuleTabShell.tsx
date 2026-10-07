import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { focusTabPanelContent, nextTabIndex } from '@/lib/a11y/tablist-keyboard';
import {
  PlatformRepurposerSkeleton,
  SingleColumnSkeleton,
  TableSkeleton,
  TwoColumnSkeleton,
} from '@/components/molecules/LayoutSkeletons';
import {
  pbFocusVisibleRingClassName,
  tabActiveClassName,
  tabInactiveClassName,
} from './personal-branding-ui';

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
  /** `fill` = viewport-bounded tab panel (Content Workbench). Default `flow`. */
  layout?: 'flow' | 'fill';
  /** When `layout="fill"`, controls tab panel overflow. Default `auto`. */
  panelOverflow?: 'hidden' | 'auto';
  /** When `layout="fill"` and `keepMounted`, per-tab overflow (overrides `panelOverflow`). */
  getPanelOverflow?: (tabId: string) => 'hidden' | 'auto';
  /** Keep inactive tab panels mounted (hidden + inert) to preserve scroll and in-tab UI state. */
  keepMounted?: boolean;
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
  layout = 'flow',
  panelOverflow = 'auto',
  getPanelOverflow,
  keepMounted = false,
  renderPanel,
}: SubModuleTabShellProps) {
  const [internalTab, setInternalTab] = useState(defaultTabId);
  const activeTab = activeTabId ?? internalTab;
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const tabButtonId = (tabId: string) => `${reactId}-tab-${tabId}`;
  const panelIdFor = (tabId: string) => (keepMounted ? `${reactId}-panel-${tabId}` : panelId);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingPanelFocusRef = useRef(false);

  const resolvePanelOverflow = (tabId: string) => getPanelOverflow?.(tabId) ?? panelOverflow;

  const selectTab = (tabId: string, options?: { focusPanel?: boolean }) => {
    if (isLoading) return;
    if (onTabChange) onTabChange(tabId);
    else setInternalTab(tabId);
    if (options?.focusPanel) {
      pendingPanelFocusRef.current = true;
    }
  };

  useEffect(() => {
    if (!pendingPanelFocusRef.current || isLoading) return;
    pendingPanelFocusRef.current = false;
    const frame = requestAnimationFrame(() => {
      const panel = keepMounted ? panelRefs.current[activeTab] : panelRef.current;
      if (panel) {
        focusTabPanelContent(panel);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, isLoading, keepMounted]);

  const handleTabClick = (tabId: string) => {
    selectTab(tabId, { focusPanel: true });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (isLoading) return;

    const nextIndex = nextTabIndex(tabs.length, index, event.key);
    if (nextIndex === null) return;

    event.preventDefault();
    const tab = tabs[nextIndex];
    if (!tab) return;
    selectTab(tab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  const isFillLayout = layout === 'fill';
  const activeTabButtonId = tabButtonId(activeTab);

  const renderPanelContent = (tabId: string, isActive: boolean) => {
    if (isLoading && isActive) {
      return renderSkeletonLayout(skeletonLayout);
    }
    return renderPanel(tabId);
  };

  const panelOverflowClass = (overflow: 'hidden' | 'auto') =>
    overflow === 'hidden' ? 'overflow-hidden' : 'overflow-y-auto';

  return (
    <div className={cn(isFillLayout ? 'flex h-full min-h-0 flex-col gap-6' : 'space-y-6')}>
      <div
        className={cn(
          'flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700',
          isFillLayout && 'shrink-0'
        )}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabButtonId(tab.id)}
            aria-selected={activeTab === tab.id}
            aria-controls={panelIdFor(tab.id)}
            aria-disabled={isLoading}
            disabled={isLoading}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              activeTab === tab.id ? tabActiveClassName : tabInactiveClassName,
              pbFocusVisibleRingClassName,
              isLoading && 'cursor-not-allowed opacity-70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {keepMounted ? (
        <div className={cn(isFillLayout && 'min-h-0 flex-1 flex flex-col')}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const overflow = resolvePanelOverflow(tab.id);
            return (
              <div
                key={tab.id}
                ref={(element) => {
                  panelRefs.current[tab.id] = element;
                }}
                id={panelIdFor(tab.id)}
                role="tabpanel"
                aria-labelledby={tabButtonId(tab.id)}
                hidden={!isActive}
                inert={!isActive ? true : undefined}
                aria-busy={isLoading && isActive}
                tabIndex={-1}
                className={cn(
                  isFillLayout && isActive && 'min-h-0 flex-1',
                  isFillLayout && isActive && panelOverflowClass(overflow)
                )}
              >
                {renderPanelContent(tab.id, isActive)}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          ref={panelRef}
          id={panelId}
          role="tabpanel"
          aria-labelledby={activeTabButtonId}
          aria-busy={isLoading}
          tabIndex={-1}
          className={cn(
            isFillLayout && 'min-h-0 flex-1',
            isFillLayout && panelOverflowClass(panelOverflow)
          )}
        >
          {isLoading ? renderSkeletonLayout(skeletonLayout) : renderPanel(activeTab)}
        </div>
      )}
    </div>
  );
}
