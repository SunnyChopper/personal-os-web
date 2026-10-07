import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import CompleteProjectDialog from '@/components/organisms/personal-branding/CompleteProjectDialog';
import { usePersonalBrandingProjectsMutations } from '@/hooks/usePersonalBrandingProjects';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { formatCompleteMutationError } from '@/lib/personal-branding/format-complete-mutation-error';
import { ROUTES } from '@/routes';
import { pbFeedbackTextClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { assistantSettingsDirtyBarClassName } from '@/components/molecules/settings/assistant-settings-surfaces';
import type { BrandProjectIdea } from '@/types/api/personal-branding.dto';

const ACTIVE_LIST_HREF = `${ROUTES.admin.personalBrandingProjects}?tab=active`;

const REJECT_CATEGORIES = [
  { id: 'too_complex', label: 'Too complex' },
  { id: 'not_trending', label: 'Not trending' },
  { id: 'not_shareable', label: 'Not shareable' },
  { id: 'off_niche', label: 'Off niche' },
  { id: 'already_exists', label: 'Already exists' },
  { id: 'other', label: 'Other' },
];

export interface BuildIdeaActionBarProps {
  idea: BrandProjectIdea;
}

export default function BuildIdeaActionBar({ idea }: BuildIdeaActionBarProps) {
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [kitJob, setKitJob] = useState<{ ideaId: string; jobId: string } | null>(null);

  const { reject, complete, buildKit, jobQuery } = usePersonalBrandingProjectsMutations();

  const activeKitJob =
    kitJob?.ideaId === idea.id && jobQuery.data?.jobId === kitJob.jobId ? jobQuery.data : undefined;

  const kitJobFailed = activeKitJob?.status === 'failed';
  const kitInlineError = kitJobFailed
    ? activeKitJob.error?.trim() || 'Build kit failed.'
    : undefined;

  const kitInFlight =
    !idea.buildKit &&
    !kitJobFailed &&
    ((buildKit.isPending && buildKit.variables === idea.id) ||
      (activeKitJob != null &&
        activeKitJob.jobType === 'kit' &&
        !['succeeded', 'failed'].includes(activeKitJob.status)) ||
      activeKitJob?.status === 'succeeded');

  const barDisabled = kitInFlight;

  useTerminalJobFailureAlert({
    feature: 'projectBuildKit',
    jobId: kitJobFailed ? activeKitJob?.jobId : undefined,
    status: kitJobFailed ? activeKitJob?.status : undefined,
    error: kitJobFailed ? activeKitJob?.error : undefined,
    errorCode: kitJobFailed ? activeKitJob?.errorCode : undefined,
    retryable: kitJobFailed ? activeKitJob?.retryable : undefined,
  });

  const handleViewKit = () => {
    document.getElementById('build-kit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerateKit = () => {
    buildKit.mutate(idea.id, {
      onSuccess: (data) => {
        setKitJob({ ideaId: idea.id, jobId: data.jobId });
      },
    });
  };

  const navigateToActive = () => {
    navigate(ACTIVE_LIST_HREF);
  };

  const showLifecycleActions = idea.status === 'generated';
  const hasKit = Boolean(idea.buildKit);

  return (
    <>
      <div data-slot="BuildIdeaActionBar" className={assistantSettingsDirtyBarClassName}>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {kitInlineError ? (
            <p role="alert" className={pbFeedbackTextClassName('danger')}>
              {kitInlineError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showLifecycleActions ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={barDisabled}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={barDisabled}
                  onClick={() => {
                    setCompleteError(null);
                    setCompleteOpen(true);
                  }}
                >
                  Mark complete
                </Button>
              </>
            ) : null}
            {hasKit ? (
              <Button type="button" size="sm" disabled={barDisabled} onClick={handleViewKit}>
                View build kit
              </Button>
            ) : showLifecycleActions ? (
              <Button type="button" size="sm" disabled={barDisabled} onClick={handleGenerateKit}>
                {kitInFlight ? 'Generating…' : 'Generate build kit'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <RejectWithFeedbackModal
        isOpen={rejectOpen}
        title="Reject project idea"
        subjectLabel={idea.title}
        categories={REJECT_CATEGORIES}
        feedbackRequired
        isSubmitting={reject.isPending}
        errorMessage={
          reject.error instanceof Error
            ? reject.error.message
            : reject.error
              ? 'Could not reject this idea. Try again.'
              : null
        }
        onClose={() => {
          setRejectOpen(false);
          reject.reset();
        }}
        onSubmit={(feedbackText, feedbackCategory) => {
          if (typeof feedbackText !== 'string' || feedbackText.length === 0) {
            return;
          }
          reject.mutate(
            {
              ideaId: idea.id,
              feedbackText,
              feedbackCategory: feedbackCategory ?? undefined,
            },
            {
              onSuccess: () => {
                setRejectOpen(false);
                navigateToActive();
              },
            }
          );
        }}
      />

      <CompleteProjectDialog
        open={completeOpen}
        title={idea.title}
        isSubmitting={complete.isPending}
        error={completeError}
        onClose={() => {
          setCompleteError(null);
          setCompleteOpen(false);
        }}
        onSubmit={(links) => {
          setCompleteError(null);
          complete.mutate(
            { ideaId: idea.id, postLinks: links },
            {
              onSuccess: () => {
                setCompleteError(null);
                setCompleteOpen(false);
                navigateToActive();
              },
              onError: (err) => setCompleteError(formatCompleteMutationError(err)),
            }
          );
        }}
      />
    </>
  );
}
