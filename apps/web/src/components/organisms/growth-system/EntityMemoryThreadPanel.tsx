import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ProjectDetailCollapsible } from '@/components/molecules/ProjectDetailCollapsible';
import type { EntityMemoryThread, EntityMemoryThreadItem } from '@/types/growth-system';

interface EntityMemoryThreadPanelProps {
  entityType: 'project' | 'goal';
  entityId: string;
  days?: number;
  fetchThread: (id: string, days?: number) => Promise<EntityMemoryThread | null>;
  onEmptyAction?: () => void;
  reloadKey?: number;
  isEmptyActionLoading?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function categoryClass(category: string): string {
  switch (category) {
    case 'Decision':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200';
    case 'Blocker':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case 'Progress':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function sourceLink(item: EntityMemoryThreadItem): { to: string; label: string } | null {
  if (item.sourceType === 'stmNote' && item.stmFileDate) {
    return {
      to: `/admin/assistant?memoryDate=${item.stmFileDate}`,
      label: `Daily Memory ${item.stmFileDate}`,
    };
  }
  if (item.sourceType === 'logbookEntry' && item.logbookDate) {
    return {
      to: `/admin/logbook?date=${item.logbookDate}`,
      label: `Logbook ${item.logbookDate}`,
    };
  }
  return null;
}

export function EntityMemoryThreadPanel({
  entityType,
  entityId,
  days = 30,
  fetchThread,
  onEmptyAction,
  reloadKey = 0,
  isEmptyActionLoading = false,
  collapsible = false,
  defaultOpen = false,
}: EntityMemoryThreadPanelProps) {
  const [thread, setThread] = useState<EntityMemoryThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchThread(entityId, days)
      .then((data) => {
        if (!cancelled) setThread(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load memory thread');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, days, fetchThread, reloadKey]);

  const threadCount = thread ? (thread.totalItems ?? thread.items.length) : null;
  const count = loading ? null : (threadCount ?? 0);

  const panelContent = (
    <>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading linked notes…
        </div>
      )}

      {!loading && error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {!loading && !error && (!thread || thread.items.length === 0) && (
        <EmptyState
          icon={BookOpen}
          title="No memory linked yet"
          actionLabel="Link a logbook entry or start a memory thread"
          onAction={onEmptyAction}
          actionDisabled={!onEmptyAction || isEmptyActionLoading}
          className="py-6 [&_h3]:text-base [&_h3]:font-medium"
        />
      )}

      {!loading && !error && thread && thread.items.length > 0 && (
        <ul className="space-y-3">
          {thread.items.map((item) => {
            const link = sourceLink(item);
            const Icon = item.sourceType === 'logbookEntry' ? BookOpen : Brain;
            return (
              <li
                key={`${item.sourceType}-${item.sourceKey}-${item.occurredAt}`}
                className="border border-gray-100 dark:border-gray-700 rounded-md p-3 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${categoryClass(item.category)}`}
                  >
                    {item.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Icon className="w-3 h-3" />
                    {item.sourceType === 'stmNote' ? 'Daily Memory' : 'Logbook'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(item.occurredAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.excerpt}</p>
                {link && (
                  <Link
                    to={link.to}
                    className="inline-block mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open {link.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (collapsible) {
    return (
      <ProjectDetailCollapsible
        title="Memory thread"
        count={count}
        suffix={`Last ${days} days`}
        icon={Brain}
        iconClassName="text-indigo-600 dark:text-indigo-400"
        defaultOpen={defaultOpen}
      >
        {panelContent}
      </ProjectDetailCollapsible>
    );
  }

  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory thread</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">Last {days} days</span>
      </div>
      {panelContent}
    </div>
  );
}
