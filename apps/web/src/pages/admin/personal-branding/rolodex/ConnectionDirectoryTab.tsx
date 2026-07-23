import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useToast } from '@/hooks/use-toast';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';
import type { useRolodex } from '@/hooks/useRolodex';
import ConnectionEditorDialog from './ConnectionEditorDialog';
import FollowUpQuickEditor from './FollowUpQuickEditor';
import ProfileLinkBadge from './ProfileLinkBadge';
import RelationshipPriorityBadge from './RelationshipPriorityBadge';
import RelationshipStageBadge from './RelationshipStageBadge';
import { formatLastReconAgeLabel, lastReconSortKey } from './rolodex-platform';
import { PageCard } from '../PersonalBrandingPageTemplate';

type RolodexHook = ReturnType<typeof useRolodex>;

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function LastReconAgeCell({ postedAt }: { postedAt?: string | null }) {
  const { label, title } = formatLastReconAgeLabel(postedAt);
  return (
    <span className="text-sm text-gray-600 dark:text-gray-300" title={title}>
      {label}
    </span>
  );
}

type LastReconSortDirection = 'asc' | 'desc';

interface ConnectionDirectoryTabProps {
  rolodex: RolodexHook;
}

export default function ConnectionDirectoryTab({ rolodex }: ConnectionDirectoryTabProps) {
  const { showToast, ToastContainer } = useToast();
  const connections = rolodex.connections.data?.data ?? [];
  const [lastReconSort, setLastReconSort] = useState<LastReconSortDirection>('asc');
  const sortedConnections = useMemo(() => {
    const list = [...connections];
    return list.sort((a, b) => {
      const keyA = lastReconSortKey(a);
      const keyB = lastReconSortKey(b);
      return lastReconSort === 'asc' ? keyA - keyB : keyB - keyA;
    });
  }, [connections, lastReconSort]);
  const metrics = rolodex.trackingMetrics.data?.data ?? [];
  const metricById = useMemo(() => new Map(metrics.map((m) => [m.id, m.name])), [metrics]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CreatorConnection | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (connection: CreatorConnection) => {
    setEditing(connection);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage high-value creator targets, relationship strategy, and follow-up plans.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          Add connection
        </Button>
      </div>

      <PageCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Profile
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Priority / Stage
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Next follow-up
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Last interacted
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  <button
                    type="button"
                    onClick={() =>
                      setLastReconSort((current) => (current === 'asc' ? 'desc' : 'asc'))
                    }
                    className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                    aria-label={`Sort by last recon, ${lastReconSort === 'asc' ? 'oldest first' : 'newest first'}`}
                  >
                    Last recon
                    {lastReconSort === 'asc' ? (
                      <ArrowUp className="size-3.5" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3.5" aria-hidden />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {sortedConnections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No connections yet.
                  </td>
                </tr>
              ) : (
                sortedConnections.map((connection) => (
                  <tr key={connection.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {connection.name}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <ProfileLinkBadge connection={connection} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RelationshipPriorityBadge connection={connection} />
                        <RelationshipStageBadge stage={connection.relationshipStage} />
                      </div>
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-gray-600 dark:text-gray-300">
                      <p className="line-clamp-2">{connection.desiredOutcome?.trim() || '—'}</p>
                      {connection.nextAction?.trim() ? (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                          Next: {connection.nextAction}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <FollowUpQuickEditor
                        connection={connection}
                        isSaving={rolodex.updateConnection.isPending}
                        onSave={async (body) => {
                          try {
                            await rolodex.updateConnection.mutateAsync({
                              id: connection.id,
                              body,
                            });
                            showToast({ type: 'success', title: 'Follow-up updated' });
                          } catch (err) {
                            showToast({
                              type: 'error',
                              title: err instanceof Error ? err.message : 'Update failed',
                            });
                            throw err;
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">{formatDate(connection.lastInteractedAt)}</td>
                    <td className="px-4 py-3">
                      <LastReconAgeCell postedAt={connection.lastReconPostedAt} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(connection)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label={`Edit ${connection.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Archive ${connection.name}?`)) return;
                            try {
                              await rolodex.deleteConnection.mutateAsync(connection.id);
                              showToast({ type: 'success', title: 'Connection archived' });
                            } catch (err) {
                              showToast({
                                type: 'error',
                                title: err instanceof Error ? err.message : 'Delete failed',
                              });
                            }
                          }}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label={`Archive ${connection.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      {metrics.length > 0 ? (
        <p className="text-xs text-gray-500">
          Tracking metrics available:{' '}
          {metrics.map((m) => metricById.get(m.id) ?? m.slug).join(', ')}
        </p>
      ) : null}

      <ConnectionEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        isSubmitting={rolodex.createConnection.isPending || rolodex.updateConnection.isPending}
        onCreate={async (body) => {
          try {
            await rolodex.createConnection.mutateAsync(body);
            showToast({ type: 'success', title: 'Connection created' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Create failed',
            });
            throw err;
          }
        }}
        onUpdate={async (id, body) => {
          try {
            await rolodex.updateConnection.mutateAsync({ id, body });
            showToast({ type: 'success', title: 'Connection updated' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Update failed',
            });
            throw err;
          }
        }}
      />

      <ToastContainer />
    </div>
  );
}
