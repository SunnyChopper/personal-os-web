import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RadarDiscoveryPanel from '@/components/organisms/personal-branding/RadarDiscoveryPanel';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from '../personal-branding-ui';
import SourceEditorDialog from '@/components/organisms/personal-branding/SourceEditorDialog';
import { useToast } from '@/hooks/use-toast';
import { type useSignalRadar } from '@/hooks/useSignalRadar';
import { RADAR_SOURCE_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import type { RadarSource } from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';

type SignalRadarHook = ReturnType<typeof useSignalRadar>;

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

interface SourceManagementTabProps {
  signalRadar: SignalRadarHook;
}

export default function SourceManagementTab({ signalRadar }: SourceManagementTabProps) {
  const { showToast, ToastContainer } = useToast();
  const sources = signalRadar.sources.data?.data ?? [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RadarSource | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (source: RadarSource) => {
    setEditing(source);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            RSS feeds and API endpoints polled for Trend Stream cards. Sync cadence lives in Trend
            Stream → Sync settings.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            Add source
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Secret
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Last scraped
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No sources yet. Add a feed or run discovery below.
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {source.name}
                      {!source.enabled ? (
                        <span className="ml-2 text-xs text-gray-500">(disabled)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{RADAR_SOURCE_TYPE_LABELS[source.sourceType]}</td>
                    <td className={cn('max-w-[220px] truncate px-4 py-3', linkAccentClassName)}>
                      <a href={source.endpoint} target="_blank" rel="noreferrer">
                        {source.endpoint}
                      </a>
                    </td>
                    <td className="px-4 py-3">{source.hasSecret ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3">{formatDate(source.lastScrapedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(source)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label={`Edit ${source.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Delete ${source.name}?`)) return;
                            try {
                              await signalRadar.deleteSource.mutateAsync(source.id);
                              showToast({ type: 'success', title: 'Source deleted' });
                            } catch (err) {
                              showToast({
                                type: 'error',
                                title: err instanceof Error ? err.message : 'Delete failed',
                              });
                            }
                          }}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label={`Delete ${source.name}`}
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

      <RadarDiscoveryPanel signalRadar={signalRadar} />

      <SourceEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
        isSubmitting={signalRadar.createSource.isPending || signalRadar.updateSource.isPending}
        onCreate={async (body) => {
          try {
            await signalRadar.createSource.mutateAsync(body);
            showToast({ type: 'success', title: 'Source created' });
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
            await signalRadar.updateSource.mutateAsync({ id, body });
            showToast({ type: 'success', title: 'Source updated' });
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
