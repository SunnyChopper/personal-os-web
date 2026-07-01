import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import { careerService } from '@/services/career.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { CareerJobPosting, CareerJobPostingPatchRequest } from '@/types/api/career.types';
import { Select } from '@/components/atoms/Select';

const KNOWN_PROVIDERS = ['greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters'] as const;

const FIT_STATUS_OPTIONS = [
  'notEvaluated',
  'strongFit',
  'moderateFit',
  'weakFit',
  'notAFit',
] as const;

function fieldInputClassName() {
  return 'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900';
}

function postingDescription(posting: CareerJobPosting | null | undefined): string {
  if (!posting) return '';
  return (posting.rawText || posting.fetchedText || '').trim();
}

export interface JobPostingEditModalProps {
  posting: CareerJobPosting;
  onClose: () => void;
  onSaved?: (posting: CareerJobPosting) => void;
}

export function JobPostingEditModal({ posting, onClose, onSaved }: JobPostingEditModalProps) {
  const qc = useQueryClient();
  const detailKey = queryKeys.careerResume.jobPostingDetail(posting.id);

  const detailQ = useQuery({
    queryKey: detailKey,
    queryFn: () => careerService.getJobPosting(posting.id),
    initialData: posting,
  });

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [provider, setProvider] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [boardId, setBoardId] = useState('');
  const [externalJobId, setExternalJobId] = useState('');
  const [seniority, setSeniority] = useState('');
  const [fitStatus, setFitStatus] = useState('notEvaluated');
  const [actionError, setActionError] = useState<string | null>(null);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const fullPosting = detailQ.data ?? posting;

  useEffect(() => {
    const p = fullPosting;
    setTitle(p.title || p.roleGuess || '');
    setCompany(p.company || p.companyGuess || '');
    setLocation(p.location || '');
    setProvider(p.provider || p.jobBoard || '');
    setCompanySlug(p.companySlug || p.jobBoardCompanyId || '');
    setBoardId(p.boardId || '');
    setExternalJobId(p.externalJobId || '');
    setSeniority(p.seniority || '');
    setFitStatus(p.fitStatus || 'notEvaluated');
  }, [fullPosting]);

  const saveMutation = useMutation({
    mutationFn: (body: CareerJobPostingPatchRequest) =>
      careerService.updateJobPosting(posting.id, body),
    onSuccess: async (updated) => {
      setActionError(null);
      qc.setQueryData(detailKey, updated);
      await qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobPostingsPrefix() });
      onSaved?.(updated);
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : String(err));
    },
  });

  const ingestMutation = useMutation({
    mutationFn: () =>
      careerService.ingestJobPosting({
        sourceUrl: fullPosting.sourceUrl || fullPosting.normalizedSourceUrl || null,
        provider: provider.trim() || null,
        companySlug: companySlug.trim() || null,
        boardId: boardId.trim() || null,
        externalJobId: externalJobId.trim() || null,
        saveEvenIfLowConfidence: true,
      }),
    onSuccess: async (result) => {
      setActionError(null);
      const updated = result.posting;
      qc.setQueryData(detailKey, updated);
      await qc.invalidateQueries({ queryKey: queryKeys.careerResume.jobPostingsPrefix() });
      const dup = result.duplicate ? ' (duplicate)' : '';
      setIngestMessage(`Re-ingestion complete: ${result.mergeAction}${dup}.`);
      onSaved?.(updated);
    },
    onError: (err: unknown) => {
      setIngestMessage(null);
      setActionError(err instanceof Error ? err.message : String(err));
    },
  });

  const description = useMemo(() => postingDescription(fullPosting), [fullPosting]);
  const isBusy = saveMutation.isPending || ingestMutation.isPending || detailQ.isFetching;
  const canReIngest = Boolean(
    (fullPosting.sourceUrl || fullPosting.normalizedSourceUrl || '').trim()
  );

  function buildPatchBody(): CareerJobPostingPatchRequest {
    return {
      title: title.trim() || null,
      company: company.trim() || null,
      location: location.trim() || null,
      provider: provider.trim() || null,
      companySlug: companySlug.trim() || null,
      boardId: boardId.trim() || null,
      externalJobId: externalJobId.trim() || null,
      seniority: seniority.trim() || null,
      fitStatus: fitStatus.trim() || null,
    };
  }

  function handleSave() {
    setIngestMessage(null);
    void saveMutation.mutate(buildPatchBody());
  }

  function handleReIngest() {
    setIngestMessage(null);
    void ingestMutation.mutate();
  }

  return (
    <Dialog
      isOpen
      onClose={() => {
        if (isBusy) return;
        onClose();
      }}
      title="Edit saved posting"
      size="full"
    >
      <div className="space-y-4">
        {detailQ.isLoading ? (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading posting details…
          </p>
        ) : null}

        {detailQ.error ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
          >
            {detailQ.error instanceof Error ? detailQ.error.message : String(detailQ.error)}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Editable fields</h3>
            <label className="flex flex-col gap-1 text-sm">
              Title
              <input
                className={fieldInputClassName()}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Company
              <input
                className={fieldInputClassName()}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Provider
              <input
                className={fieldInputClassName()}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                list="job-posting-provider-options"
                placeholder="e.g. greenhouse"
                disabled={isBusy}
              />
              <datalist id="job-posting-provider-options">
                {KNOWN_PROVIDERS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Location
              <input
                className={fieldInputClassName()}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Seniority
              <input
                className={fieldInputClassName()}
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Company slug
              <input
                className={fieldInputClassName()}
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Board ID
              <input
                className={fieldInputClassName()}
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              External job ID
              <input
                className={fieldInputClassName()}
                value={externalJobId}
                onChange={(e) => setExternalJobId(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fit status
              <Select
                className={fieldInputClassName()}
                value={fitStatus}
                onChange={(e) => setFitStatus(e.target.value)}
                disabled={isBusy}
              >
                {FIT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </label>
          </section>

          <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Parsed description
            </h3>
            <p className="text-xs text-gray-500 break-all">
              Source: {fullPosting.sourceUrl || fullPosting.normalizedSourceUrl || '—'}
            </p>
            <pre className="max-h-[min(60vh,520px)] overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-3 text-xs whitespace-pre-wrap">
              {description || 'No parsed job description stored for this posting.'}
            </pre>
          </section>

          <section className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save manual corrections for provider, location, and other metadata. Re-run ingestion
              to fetch and parse the source URL again.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Save changes
              </button>
              <button
                type="button"
                onClick={handleReIngest}
                disabled={isBusy || !canReIngest}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {ingestMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                Re-run ingestion
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Close
              </button>
            </div>
            {!canReIngest ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Re-ingestion requires a stored source URL on this posting.
              </p>
            ) : null}
            {ingestMessage ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
                {ingestMessage}
              </p>
            ) : null}
            {actionError ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300"
              >
                {actionError}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </Dialog>
  );
}
