import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/templates/PageContainer';
import Button from '@/components/atoms/Button';
import SpecialistFormModal from '@/components/organisms/assistant/SpecialistFormModal';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import { assistantSpecialistsService } from '@/services/assistant-specialists.service';
import { apiClient } from '@/lib/api-client';
import type { AssistantSpecialist, AssistantToolRegistryEntry } from '@/types/api-contracts';
import { queryKeys } from '@/lib/react-query/query-keys';
import { cn } from '@/lib/utils';
import { uploadToS3WithProgress } from '@/lib/upload-to-s3-with-progress';
import {
  specialistCardClassName,
  specialistChipClassName,
  specialistLabelClassName,
  specialistMutedTextClassName,
  specialistPageContainerClassName,
  specialistPageScrollClassName,
  specialistPageRootClassName,
  specialistPanelClassName,
} from '@/lib/assistant/specialist-admin-surfaces';

export default function AssistantSpecialistsPage() {
  const queryClient = useQueryClient();
  const specialistsQ = useQuery({
    queryKey: queryKeys.assistantSpecialists.list(),
    queryFn: async () => {
      const response = await assistantSpecialistsService.list();
      if (!response.success)
        throw new Error(response.error?.message || 'Unable to load specialists');
      return response.data ?? [];
    },
  });
  const toolRegistryQ = useQuery<AssistantToolRegistryEntry[]>({
    queryKey: [...queryKeys.assistantSpecialists.all, 'tool-registry'],
    queryFn: async () => {
      const response = await apiClient.getAssistantToolRegistry();
      if (!response.success) throw new Error(response.error?.message || 'Unable to load tools');
      return response.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
  const [editing, setEditing] = useState<AssistantSpecialist | null | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AssistantSpecialist | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editingExisting = editing !== undefined && editing !== null;
  const specialists = specialistsQ.data ?? [];
  const documentsQ = useQuery({
    queryKey: queryKeys.assistantSpecialists.documents(editing?.id ?? ''),
    queryFn: async () => {
      const response = await assistantSpecialistsService.listDocuments(editing?.id ?? '');
      if (!response.success) throw new Error(response.error?.message || 'Unable to load documents');
      return response.data ?? [];
    },
    enabled: editingExisting,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.assistantSpecialists.all });
  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = editingExisting
        ? await assistantSpecialistsService.update(editing?.id ?? '', payload)
        : await assistantSpecialistsService.create(payload);
      if (!response.success)
        throw new Error(response.error?.message || 'Unable to save specialist');
      return response.data;
    },
    onSuccess: async () => {
      setEditing(undefined);
      await invalidate();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await assistantSpecialistsService.remove(id);
      if (!response.success)
        throw new Error(response.error?.message || 'Unable to delete specialist');
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await invalidate();
    },
  });
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const response = await assistantSpecialistsService.restoreDefaults();
      if (!response.success)
        throw new Error(response.error?.message || 'Unable to restore defaults');
    },
    onSuccess: invalidate,
  });

  const enabledCount = specialists.filter((row) => row.enabled).length;
  const openEditor = (row?: AssistantSpecialist) => {
    setEditing(row ?? null);
  };
  const uploadDocument = async (files: File[]) => {
    const specialistId = editing?.id;
    const file = files[0];
    if (!specialistId || !file) return;
    setUploadError(null);
    setUploadingFile(file.name);
    try {
      const slot = await assistantSpecialistsService.createDocumentUpload(specialistId, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
      });
      if (!slot.success || !slot.data?.uploadUrl || !slot.data.id) {
        throw new Error(slot.error?.message || 'Unable to create upload slot');
      }
      await uploadToS3WithProgress(slot.data.uploadUrl, file);
      const complete = await assistantSpecialistsService.completeDocumentUpload(
        specialistId,
        slot.data.id
      );
      if (!complete.success) throw new Error(complete.error?.message || 'Unable to index document');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.assistantSpecialists.documents(specialistId),
      });
      await invalidate();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to upload document');
    } finally {
      setUploadingFile(null);
    }
  };
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!editing?.id) return;
      const response = await assistantSpecialistsService.deleteDocument(editing.id, documentId);
      if (!response.success)
        throw new Error(response.error?.message || 'Unable to delete document');
    },
    onSuccess: () =>
      editing?.id &&
      queryClient.invalidateQueries({
        queryKey: queryKeys.assistantSpecialists.documents(editing.id),
      }),
  });

  return (
    <div className={specialistPageScrollClassName}>
      <PageContainer className={specialistPageContainerClassName}>
        <div className={specialistPageRootClassName}>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={specialistLabelClassName}>Assistant configuration</p>
              <h1 className="mt-1 text-2xl font-semibold">Specialists</h1>
              <p className={cn('mt-2 max-w-2xl text-sm', specialistMutedTextClassName)}>
                Configure advisory perspectives, skill-like triggers, and bounded context. The
                engine still caps specialists and blocks writes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => restoreMutation.mutate()}
                disabled={restoreMutation.isPending}
              >
                <RotateCcw className="mr-1.5 size-4" aria-hidden />
                Restore defaults
              </Button>
              <Button variant="primary" size="sm" onClick={() => openEditor()}>
                <Plus className="mr-1.5 size-4" aria-hidden />
                New specialist
              </Button>
            </div>
          </header>

          <section
            className={cn(specialistPanelClassName, 'flex flex-wrap gap-6 px-5 py-4 text-sm')}
            aria-label="Specialist summary"
          >
            <span>
              <strong>{specialists.length}</strong> configured
            </span>
            <span>
              <strong>{enabledCount}</strong> enabled
            </span>
            <span className={specialistMutedTextClassName}>
              Advisory only · max 3 per turn · fail-soft
            </span>
          </section>

          {specialistsQ.isLoading ? (
            <div
              className={cn(specialistPanelClassName, 'p-6 text-sm', specialistMutedTextClassName)}
            >
              Loading specialists…
            </div>
          ) : specialistsQ.isError ? (
            <div
              className={cn(specialistPanelClassName, 'p-6 text-sm text-red-700 dark:text-red-300')}
            >
              Unable to load specialists.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {specialists.map((row) => (
                <article key={row.id} className={specialistCardClassName}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate font-semibold">{row.displayName}</h2>
                        <span
                          className={cn(
                            specialistChipClassName,
                            !row.enabled &&
                              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          )}
                        >
                          {row.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <Settings2 className="size-5 shrink-0 text-blue-500" aria-hidden />
                  </div>
                  <p className={cn('mt-4 line-clamp-3 text-sm', specialistMutedTextClassName)}>
                    {row.systemPrompt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {row.triggers.keywords.slice(0, 5).map((keyword) => (
                      <span key={keyword} className={specialistChipClassName}>
                        {keyword}
                      </span>
                    ))}
                    {row.triggers.mode !== 'auto' && (
                      <span className={specialistChipClassName}>{row.triggers.mode}</span>
                    )}
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEditor(row)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                      <Trash2 className="mr-1.5 size-4" aria-hidden />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <SpecialistFormModal
          isOpen={editing !== undefined}
          specialist={editing ?? null}
          toolRegistry={toolRegistryQ.data}
          toolsLoading={toolRegistryQ.isLoading}
          documents={documentsQ.data}
          documentsLoading={documentsQ.isLoading}
          uploadingFile={uploadingFile}
          uploadError={uploadError}
          saving={saveMutation.isPending}
          saveError={saveMutation.error}
          deletingDocument={deleteDocumentMutation.isPending}
          onClose={() => setEditing(undefined)}
          onSave={(payload) => saveMutation.mutate(payload)}
          onUploadDocument={uploadDocument}
          onDeleteDocument={(documentId) => deleteDocumentMutation.mutate(documentId)}
        />

        <ConfirmDialog
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          title="Delete specialist?"
          description={
            deleteTarget
              ? `Delete ${deleteTarget.displayName}? The engine will stop consulting it immediately.`
              : undefined
          }
          confirmLabel="Delete specialist"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </PageContainer>
    </div>
  );
}
