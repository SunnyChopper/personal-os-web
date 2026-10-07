import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { usePersonalBrandingProjectsMutations } from '@/hooks/usePersonalBrandingProjects';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import {
  describeRevisionOperation,
  isProposalStale,
  revisionOperationBody,
} from '@/lib/personal-branding/build-kit-revision';
import {
  pbBodySecondaryClassName,
  pbFeedbackTextClassName,
  pbMetaClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectKitRevisionProposal } from '@/types/api/personal-branding.dto';

export interface BuildKitRevisePanelProps {
  ideaId: string;
  generatedAt: string;
}

export default function BuildKitRevisePanel({ ideaId, generatedAt }: BuildKitRevisePanelProps) {
  const { kitRevise, applyKitRevision, jobQuery } = usePersonalBrandingProjectsMutations();
  const [repo, setRepo] = useState('');
  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const job =
    startedJobId && jobQuery.data?.jobId === startedJobId && jobQuery.data.jobType === 'kitrevise'
      ? jobQuery.data
      : undefined;
  const inFlight =
    (kitRevise.isPending && kitRevise.variables?.ideaId === ideaId) ||
    (job != null && job.status !== 'succeeded' && job.status !== 'failed');
  const failed = job?.status === 'failed';
  const proposal: BrandProjectKitRevisionProposal | null | undefined =
    job?.status === 'succeeded' ? job.proposal : undefined;
  const stale = proposal ? isProposalStale(proposal.baseGeneratedAt, generatedAt) : false;
  const alertJob = failed && job?.errorCode !== 'VALIDATION_FAILED' ? job : undefined;

  useTerminalJobFailureAlert({
    feature: 'projectBuildKit',
    jobId: alertJob?.jobId,
    status: alertJob?.status,
    error: alertJob?.error,
    errorCode: alertJob?.errorCode,
    retryable: alertJob?.retryable,
  });

  const submitRepo = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || inFlight) return;
    setApplied(false);
    setConfirmOpen(false);
    kitRevise.mutate(
      { ideaId, repo: trimmed },
      {
        onSuccess: (data) => setStartedJobId(data.jobId),
      }
    );
  };

  const applyError =
    applyKitRevision.error instanceof Error
      ? applyKitRevision.error.message
      : applyKitRevision.error
        ? 'Could not apply these changes. Try again.'
        : null;
  const itemCount = proposal?.items.length ?? 0;

  return (
    <section
      aria-label="Revise build kit from a repository"
      className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <EyebrowLabel as="p">Revise from a repository</EyebrowLabel>
      <p className={pbBodySecondaryClassName}>
        Paste a public owner/repo. This reads the file list and README, then suggests kit edits.
        Nothing is written to GitHub.
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitRepo(repo);
        }}
      >
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className={pbMetaClassName}>Repository</span>
          <FormInput
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="owner/repo"
            aria-label="Public GitHub repository"
            disabled={inFlight || applyKitRevision.isPending}
          />
        </label>
        <Button type="submit" size="sm" disabled={!repo.trim() || inFlight}>
          Suggest changes
        </Button>
      </form>

      {inFlight ? (
        <p className={pbFeedbackTextClassName('info')} aria-busy="true">
          Reading the repository…
        </p>
      ) : null}

      {failed ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50/50 px-3 py-3 dark:border-red-900/50 dark:bg-red-950/20"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {job?.error?.trim() || 'Could not suggest changes.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => submitRepo(repo)}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {proposal && itemCount === 0 ? (
        <div role="status" className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            No changes suggested
          </p>
          <p className={pbBodySecondaryClassName}>{proposal.summary}</p>
        </div>
      ) : null}

      {proposal && itemCount > 0 ? (
        <div className="space-y-3">
          <p className={pbBodySecondaryClassName}>{proposal.summary}</p>
          {proposal.treeTruncated ? (
            <p className={pbMetaClassName}>The file list was truncated.</p>
          ) : null}
          {stale && !applied ? (
            <p role="status" className={pbFeedbackTextClassName('danger')}>
              This kit changed after the suggestion. Suggest changes again.
            </p>
          ) : null}
          <ul className="space-y-2">
            {proposal.items.map((item, index) => {
              const body = revisionOperationBody(item.operation);
              return (
                <li
                  key={`${item.operation.op}-${index}`}
                  className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {describeRevisionOperation(item.operation)}
                  </p>
                  <p className={pbBodySecondaryClassName}>{item.reason}</p>
                  {body ? (
                    <details className="mt-2">
                      <summary className={pbMetaClassName}>Proposed text</summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                        {body}
                      </pre>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {applyError ? (
            <p role="alert" className={pbFeedbackTextClassName('danger')}>
              {applyError}
            </p>
          ) : null}
          {applied ? (
            <p role="status" className="text-sm text-green-700 dark:text-green-300">
              Changes applied.
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={stale || applyKitRevision.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {applyKitRevision.isPending ? 'Applying…' : `Apply ${itemCount} changes`}
            </Button>
          )}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        variant="danger"
        title="Apply kit changes"
        description="This edits the stored kit. There is no history, and generating the kit again overwrites these edits."
        confirmLabel="Apply changes"
        isLoading={applyKitRevision.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!proposal || stale) return;
          applyKitRevision.mutate(
            {
              ideaId,
              baseGeneratedAt: proposal.baseGeneratedAt,
              operations: proposal.items.map((item) => item.operation),
            },
            {
              onSuccess: () => {
                setConfirmOpen(false);
                setApplied(true);
              },
            }
          );
        }}
      />
    </section>
  );
}
