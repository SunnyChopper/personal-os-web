import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { BuildIdeaDetailBody } from '@/components/molecules/personal-branding/BuildIdeaDetailBody';
import BuildIdeaRefinePanel from '@/components/organisms/personal-branding/BuildIdeaRefinePanel';
import BuildKitRevisePanel from '@/components/organisms/personal-branding/BuildKitRevisePanel';
import BuildKitWorkspace from '@/components/organisms/personal-branding/BuildKitWorkspace';
import {
  useBrandProjectBuildKitPatch,
  useBrandProjectIdea,
  usePersonalBrandingProjectsMutations,
  useReviseBrandProjectIdea,
} from '@/hooks/usePersonalBrandingProjects';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import {
  buildIdeaBriefCardClassName,
  buildIdeaDetailPageClassName,
  buildIdeaTitleClassName,
} from '@/lib/personal-branding/build-idea-detail-surfaces';
import {
  buildProjectIdeaMetaParts,
  projectIdeaStatusLabel,
  projectIdeaStatusTone,
} from '@/lib/personal-branding/brand-project-display';
import { ROUTES } from '@/routes';
import { linkAccentClassName, pbMetaClassName, statusPillClassName } from '../personal-branding-ui';

const ACTIVE_LIST_HREF = `${ROUTES.admin.personalBrandingProjects}?tab=active`;

function BuildIdeaDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Loading project idea</span>
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export default function BuildIdeaDetailPage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const trimmedId = ideaId?.trim() ?? '';
  const ideaQuery = useBrandProjectIdea(trimmedId || undefined);
  const { buildKit, jobQuery } = usePersonalBrandingProjectsMutations();
  const revise = useReviseBrandProjectIdea(trimmedId);
  const patchKit = useBrandProjectBuildKitPatch(trimmedId);
  const [kitJob, setKitJob] = useState<{ ideaId: string; jobId: string } | null>(null);

  const idea = ideaQuery.data ?? undefined;

  const kitJobPoll = useMemo(() => {
    if (!kitJob || kitJob.ideaId !== trimmedId) return undefined;
    if (jobQuery.data?.jobId !== kitJob.jobId) return undefined;
    return jobQuery.data?.jobType === 'kit' ? jobQuery.data : undefined;
  }, [kitJob, trimmedId, jobQuery.data]);

  const storedKit = idea?.buildKit;
  const kitFailed = Boolean(!storedKit && kitJobPoll?.status === 'failed');
  const kitError = kitFailed ? kitJobPoll?.error?.trim() || 'Build kit failed.' : undefined;

  const kitLoading =
    Boolean(idea && !storedKit && !kitFailed) &&
    ((buildKit.isPending && buildKit.variables === trimmedId) ||
      (kitJobPoll != null && !['succeeded', 'failed'].includes(kitJobPoll.status)) ||
      kitJobPoll?.status === 'succeeded');

  const reviseError =
    revise.error instanceof Error
      ? revise.error.message
      : revise.error
        ? 'Could not revise this idea. Try again.'
        : null;

  useTerminalJobFailureAlert({
    feature: 'projectBuildKit',
    jobId: kitJobPoll?.status === 'failed' ? kitJobPoll.jobId : undefined,
    status: kitJobPoll?.status,
    error: kitJobPoll?.error,
    errorCode: kitJobPoll?.errorCode,
    retryable: kitJobPoll?.retryable,
  });

  const startBuildKit = () => {
    if (!trimmedId) return;
    buildKit.mutate(trimmedId, {
      onSuccess: (data) => {
        setKitJob({ ideaId: trimmedId, jobId: data.jobId });
      },
    });
  };

  const backLink = (
    <Link to={ACTIVE_LIST_HREF} className={linkAccentClassName}>
      <span className="inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" aria-hidden />
        Back to active ideas
      </span>
    </Link>
  );

  if (!trimmedId) {
    return (
      <div className="space-y-4">
        {backLink}
        <p className="text-sm text-gray-700 dark:text-gray-200">Project idea not found.</p>
      </div>
    );
  }

  if (ideaQuery.isPending) {
    return (
      <div className="space-y-4">
        {backLink}
        <BuildIdeaDetailSkeleton />
      </div>
    );
  }

  if (ideaQuery.isError) {
    return (
      <div className="space-y-4">
        {backLink}
        <div
          className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/20"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-300">
            {ideaQuery.error instanceof Error
              ? ideaQuery.error.message
              : 'Could not load this project idea. Try again.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void ideaQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (idea === null || idea === undefined) {
    return (
      <div className="space-y-4">
        {backLink}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Project idea not found
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This idea may have been removed or the link is incorrect.
        </p>
      </div>
    );
  }

  const metaParts = buildProjectIdeaMetaParts(idea);

  return (
    <div className={buildIdeaDetailPageClassName}>
      {backLink}

      <section aria-labelledby="build-idea-title" className={buildIdeaBriefCardClassName}>
        <header className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 id="build-idea-title" className={buildIdeaTitleClassName}>
              {idea.title}
            </h1>
            <span className={statusPillClassName(projectIdeaStatusTone(idea.status))}>
              {projectIdeaStatusLabel(idea.status)}
            </span>
          </div>
          {metaParts.length > 0 ? <p className={pbMetaClassName}>{metaParts.join(' · ')}</p> : null}
        </header>

        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          <BuildIdeaDetailBody
            appealSummary={idea.appealSummary}
            demoHook={idea.demoHook}
            demoCritique={idea.demoCritique}
            tutorialAngle={idea.tutorialAngle}
            backgroundKnowledge={idea.backgroundKnowledge}
            technologies={idea.technologies}
            trendSources={idea.trendSources}
          />
        </div>
      </section>

      <BuildIdeaRefinePanel
        key={idea.id}
        idea={idea}
        kitInFlight={kitLoading}
        isSending={revise.isPending}
        errorMessage={reviseError}
        onSend={(message) => revise.mutateAsync(message)}
      />

      <BuildKitWorkspace
        kit={storedKit}
        isLoading={kitLoading}
        error={kitError}
        isGeneratePending={buildKit.isPending || revise.isPending}
        onGenerate={startBuildKit}
        onRetry={startBuildKit}
        onPatch={async (operations) => {
          await patchKit.mutateAsync(operations);
        }}
        revisePanel={
          storedKit ? (
            <BuildKitRevisePanel ideaId={idea.id} generatedAt={storedKit.generatedAt} />
          ) : undefined
        }
      />

      <div data-slot="BuildIdeaActionBar" />
    </div>
  );
}
