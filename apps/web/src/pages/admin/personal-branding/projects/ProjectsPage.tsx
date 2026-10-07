import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import CompleteProjectDialog from '@/components/organisms/personal-branding/CompleteProjectDialog';
import ProjectIdeaCard from '@/components/organisms/personal-branding/ProjectIdeaCard';
import {
  useBrandProjectIdeas,
  useBrandProjectSettings,
  usePersonalBrandingProjectsMutations,
} from '@/hooks/usePersonalBrandingProjects';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { projectIdeationJobInFlight, projectIdeationShowStatus } from '@/lib/personal-branding/project-ideation-progress';
import { cn } from '@/lib/utils';
import type { BrandProjectIdea, BrandProjectIdeaStatus } from '@/types/api/personal-branding.dto';
import { formatCompleteMutationError } from '@/lib/personal-branding/format-complete-mutation-error';
import BuildIdeasSettingsPanel from './BuildIdeasSettingsPanel';
import GenerateProjectsPickerModal from './GenerateProjectsPickerModal';
import GenerationJobBanner from './GenerationJobBanner';
import SubModuleTabShell from '../SubModuleTabShell';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'settings', label: 'Settings' },
] as const;

const KNOWN_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveProjectsTabId(tab: string | null): string {
  const id = tab ?? 'active';
  return KNOWN_TAB_IDS.has(id) ? id : 'active';
}

const TAB_STATUS: Record<string, BrandProjectIdeaStatus | null> = {
  active: 'generated',
  completed: 'completed',
  rejected: 'rejected',
  settings: null,
};

const REJECT_CATEGORIES = [
  { id: 'too_complex', label: 'Too complex' },
  { id: 'not_trending', label: 'Not trending' },
  { id: 'not_shareable', label: 'Not shareable' },
  { id: 'off_niche', label: 'Off niche' },
  { id: 'already_exists', label: 'Already exists' },
  { id: 'other', label: 'Other' },
];

function ProjectIdeaListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 items-stretch" aria-busy="true">
      <span className="sr-only">Loading project ideas</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className={cn(gridItemCardClassName, 'animate-pulse space-y-3')}
          aria-hidden
        >
          <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-8 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

type IdeaListTabId = 'active' | 'completed' | 'rejected';

function ProjectIdeasEmptyState({
  tabId,
  onGenerate,
  generateDisabled,
}: {
  tabId: IdeaListTabId;
  onGenerate: () => void;
  generateDisabled: boolean;
}) {
  if (tabId === 'active') {
    return (
      <EmptyState
        icon={Lightbulb}
        density="compact"
        title="No open project ideas"
        description="Generate a batch from today's Trend Stream signals."
        actionLabel="Generate now"
        onAction={onGenerate}
        actionDisabled={generateDisabled}
      />
    );
  }
  if (tabId === 'completed') {
    return (
      <EmptyState
        icon={CheckCircle2}
        density="compact"
        title="No completed projects"
        description="Ideas you mark complete with post links appear here."
      />
    );
  }
  return (
    <EmptyState
      icon={XCircle}
      density="compact"
      title="No rejected ideas"
      description="Ideas you reject with feedback appear here."
    />
  );
}

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => resolveProjectsTabId(tabFromUrl));

  const [rejectTarget, setRejectTarget] = useState<BrandProjectIdea | null>(null);
  const [completeTarget, setCompleteTarget] = useState<BrandProjectIdea | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    if (tabFromUrl != null && tabFromUrl !== '' && !KNOWN_TAB_IDS.has(tabFromUrl)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'active');
      setSearchParams(next, { replace: true });
      setActiveTab('active');
      return;
    }
    setActiveTab(resolveProjectsTabId(tabFromUrl));
  }, [tabFromUrl, searchParams, setSearchParams]);

  const listStatus = TAB_STATUS[activeTab];
  const ideasQ = useBrandProjectIdeas(listStatus ?? 'generated', listStatus != null);
  const settingsQ = useBrandProjectSettings();
  const {
    generate,
    reject,
    complete,
    activeJobId,
    activeJobFeature,
    activeJobReplayed,
    submittedCardCount,
    lastGenerateInput,
    jobQuery,
  } = usePersonalBrandingProjectsMutations();

  const polledJob = jobQuery.data;
  useTerminalJobFailureAlert({
    feature: activeJobFeature,
    jobId: polledJob?.jobId,
    status: polledJob?.status,
    error: polledJob?.error,
    errorCode: polledJob?.errorCode,
    retryable: polledJob?.retryable,
  });

  const ideas = useMemo(() => ideasQ.data?.data ?? [], [ideasQ.data]);
  const openIdeasCount = ideasQ.data?.total ?? ideas.length;
  const listHasMore = ideasQ.data?.hasMore === true;
  const listInitialLoading = ideasQ.isPending && ideasQ.data === undefined;
  const listErrorNoData = ideasQ.isError && ideas.length === 0;

  const ideationJob =
    jobQuery.data?.jobType === 'ideation' ? jobQuery.data : undefined;
  const ideationAwaitingFirstPoll =
    activeJobFeature === 'projectIdeation' &&
    activeJobId != null &&
    ideationJob == null &&
    !generate.isPending;
  const generateDisabled =
    ideationAwaitingFirstPoll ||
    projectIdeationJobInFlight(ideationJob, generate.isPending);
  const showIdeationStatus = projectIdeationShowStatus(ideationJob, generate.isPending);
  const generateCount = settingsQ.data?.dailyCount ?? 5;
  const openPicker = () => setPickerOpen(true);
  const handleConfirmGenerate = (radarItemIds: string[]) => {
    if (radarItemIds.length === 0) return;
    generate.mutate({ count: generateCount, radarItemIds });
    setPickerOpen(false);
  };
  const handleRetryGenerate = () => {
    generate.mutate(lastGenerateInput ?? { count: generateCount });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  const renderIdeaListBody = (currentTab: IdeaListTabId) => {
    if (listInitialLoading) {
      return <ProjectIdeaListSkeleton />;
    }

    if (listErrorNoData) {
      return (
        <div
          className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/20"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {ideasQ.error instanceof Error
              ? ideasQ.error.message
              : 'Could not load project ideas. Try again.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void ideasQ.refetch()}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (ideas.length === 0) {
      return (
        <ProjectIdeasEmptyState
          tabId={currentTab}
          onGenerate={openPicker}
          generateDisabled={generateDisabled}
        />
      );
    }

    return (
      <>
        <div
          className="grid gap-4 md:grid-cols-2 items-stretch"
          data-testid="project-ideas-grid"
        >
          {ideas.map((idea) => (
            <ProjectIdeaCard
              key={idea.id}
              idea={idea}
              onReject={() => setRejectTarget(idea)}
              onComplete={() => {
                setCompleteError(null);
                setCompleteTarget(idea);
              }}
            />
          ))}
        </div>
        {listHasMore ? (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing the {ideas.length} most recent. Older ideas are not listed.
          </p>
        ) : null}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <SubModuleTabShell
        tabs={TABS}
        defaultTabId="active"
        ariaLabel="Personal Branding projects"
        activeTabId={activeTab}
        onTabChange={handleTabChange}
        renderPanel={(currentTab) => {
          if (currentTab === 'settings') {
            return <BuildIdeasSettingsPanel />;
          }

          const ideaTab = currentTab as IdeaListTabId;
          const showActiveToolbar =
            ideaTab === 'active' && !listInitialLoading && !listErrorNoData && ideas.length > 0;

          const ideationBanner =
            ideaTab === 'active' && showIdeationStatus ? (
              <GenerationJobBanner
                job={ideationJob}
                isSubmitting={generate.isPending}
                replayed={activeJobReplayed}
                cardCount={submittedCardCount}
                onRetry={handleRetryGenerate}
                retryDisabled={generate.isPending}
              />
            ) : null;

          return (
            <>
              {showActiveToolbar ? (
                <div
                  className="sticky top-20 z-10 bg-gray-50 pb-3 lg:top-0 dark:bg-gray-900"
                  data-testid="active-ideas-chrome"
                >
                  <div
                    className="flex items-center justify-between gap-3"
                    data-testid="active-ideas-toolbar"
                  >
                    <EyebrowLabel as="span" className="min-w-0">
                      {openIdeasCount} open
                    </EyebrowLabel>
                    <Button
                      className="shrink-0"
                      onClick={openPicker}
                      disabled={generateDisabled}
                    >
                      Generate now
                    </Button>
                  </div>
                  {ideationBanner}
                </div>
              ) : (
                ideationBanner
              )}
              {renderIdeaListBody(ideaTab)}
            </>
          );
        }}
      />

      {pickerOpen ? (
        <GenerateProjectsPickerModal
          open
          isSubmitting={generate.isPending}
          onClose={() => setPickerOpen(false)}
          onConfirm={handleConfirmGenerate}
        />
      ) : null}

      <RejectWithFeedbackModal
        isOpen={Boolean(rejectTarget)}
        title="Reject project idea"
        subjectLabel={rejectTarget?.title}
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
          setRejectTarget(null);
          reject.reset();
        }}
        onSubmit={(feedbackText, feedbackCategory) => {
          if (!rejectTarget || typeof feedbackText !== 'string' || feedbackText.length === 0) {
            return;
          }
          reject.mutate(
            {
              ideaId: rejectTarget.id,
              feedbackText,
              feedbackCategory: feedbackCategory ?? undefined,
            },
            { onSuccess: () => setRejectTarget(null) }
          );
        }}
      />

      <CompleteProjectDialog
        open={Boolean(completeTarget)}
        title={completeTarget?.title ?? ''}
        isSubmitting={complete.isPending}
        error={completeError}
        onClose={() => {
          setCompleteError(null);
          setCompleteTarget(null);
        }}
        onSubmit={(links) => {
          if (!completeTarget) return;
          setCompleteError(null);
          complete.mutate(
            { ideaId: completeTarget.id, postLinks: links },
            {
              onSuccess: () => {
                setCompleteError(null);
                setCompleteTarget(null);
              },
              onError: (err) => setCompleteError(formatCompleteMutationError(err)),
            }
          );
        }}
      />
    </div>
  );
}
