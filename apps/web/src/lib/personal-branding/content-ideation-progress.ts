import type {
  ContentIdeationJob,
  ContentIdeationJobStage,
} from '@/types/api/personal-branding.dto';

export type ContentIdeationPipelineStep = {
  id: ContentIdeationJobStage;
  label: string;
};

const BASE_PIPELINE_STEPS: readonly ContentIdeationPipelineStep[] = [
  { id: 'queued', label: 'Queued' },
  { id: 'validating', label: 'Validating inputs' },
] as const;

const KEYWORD_RESEARCH_STEP: ContentIdeationPipelineStep = {
  id: 'waiting_keyword_research',
  label: 'Researching keywords',
};

const LOADING_CONTEXT_STEP: ContentIdeationPipelineStep = {
  id: 'loading_context',
  label: 'Gathering context',
};

const REFERENCE_SEARCH_STEP: ContentIdeationPipelineStep = {
  id: 'searching_references',
  label: 'Searching published content',
};

const TAIL_PIPELINE_STEPS: readonly ContentIdeationPipelineStep[] = [
  { id: 'generating', label: 'Generating ideas' },
  { id: 'persisting', label: 'Saving candidates' },
] as const;

export function contentIdeationPipelineSteps(
  includeReferenceSearch: boolean,
  includeKeywordResearch = false
): readonly ContentIdeationPipelineStep[] {
  const mid: ContentIdeationPipelineStep[] = [];
  if (includeKeywordResearch) {
    mid.push(KEYWORD_RESEARCH_STEP);
  }
  mid.push(LOADING_CONTEXT_STEP);
  if (includeReferenceSearch) mid.push(REFERENCE_SEARCH_STEP);
  return [...BASE_PIPELINE_STEPS, ...mid, ...TAIL_PIPELINE_STEPS];
}

export function keywordResearchStageLabel(stage: string | null | undefined): string | null {
  if (!stage) return null;
  if (stage === 'accumulating') return 'Batching keywords for DataForSEO';
  if (stage === 'waiting') return 'Waiting on DataForSEO results';
  if (stage === 'waiting_keyword_research') return 'Researching keywords';
  return null;
}

function stageIndex(
  stage: string | null | undefined,
  steps: readonly ContentIdeationPipelineStep[]
): number {
  if (!stage) return 0;
  const direct = steps.findIndex((step) => step.id === stage);
  if (direct >= 0) return direct;
  if (stage === 'succeeded' || stage === 'failed') return steps.length;
  return 0;
}

export function contentIdeationProgressPercent(
  job: Pick<ContentIdeationJob, 'status' | 'stage'> | null | undefined,
  includeReferenceSearch: boolean,
  includeKeywordResearch = false
): number {
  const steps = contentIdeationPipelineSteps(includeReferenceSearch, includeKeywordResearch);
  if (!job) return 0;
  if (job.status === 'succeeded') return 100;
  if (job.status === 'failed') {
    const idx = stageIndex(job.stage, steps);
    return Math.max(8, Math.round(((idx + 0.5) / steps.length) * 100));
  }
  const idx = stageIndex(job.stage, steps);
  return Math.min(95, Math.round(((idx + 0.35) / steps.length) * 100));
}

export function personalBrandingJobFailureMessage(
  job: {
    error?: string | null;
    message?: string | null;
    retryable?: boolean | null;
  },
  fallback: string
): string {
  const base = job.error ?? job.message ?? fallback;
  if (job.retryable === true) return `${base} You can retry.`;
  return base;
}

export function contentIdeationStatusLabel(
  job:
    | Pick<ContentIdeationJob, 'status' | 'message' | 'error' | 'errorCode' | 'retryable'>
    | null
    | undefined
): string {
  if (!job) return 'Starting generation…';
  if (job.message?.trim()) return job.message;
  if (job.status === 'failed') {
    return personalBrandingJobFailureMessage(job, 'Content ideation failed');
  }
  if (job.status === 'cancelled') return 'Content ideation cancelled';
  if (job.status === 'cancelling') return 'Cancelling content ideation…';
  if (job.status === 'succeeded') return 'Content ideas generated';
  if (job.status === 'queued') return 'Queued for ideation';
  return 'Generating content ideas…';
}

export function contentIdeationJobInProgress(
  job: Pick<ContentIdeationJob, 'status'> | null | undefined
): boolean {
  return job?.status === 'queued' || job?.status === 'running' || job?.status === 'cancelling';
}

/** Job payload for slim progress strip while submit is in-flight but poll job not yet returned. */
export function contentIdeationPendingJobPlaceholder(): ContentIdeationJob {
  return {
    jobId: 'pending',
    status: 'queued',
    userId: '',
    createdAt: '',
    updatedAt: '',
    pollAfterMs: 2000,
  };
}

/** Progress strip owns the primary CTA slot (hide Generate) while queued/running or awaiting poll. */
export function contentIdeationCtaProgressOnly(
  job: Pick<ContentIdeationJob, 'status'> | null | undefined,
  isSubmitting: boolean
): boolean {
  return contentIdeationJobInProgress(job) || isSubmitting;
}

export function contentIdeationProgressPanelJob(
  job: ContentIdeationJob | null | undefined,
  isSubmitting: boolean
): ContentIdeationJob | null {
  if (contentIdeationJobInProgress(job)) return job ?? null;
  if (isSubmitting) {
    if (job?.status === 'failed') return contentIdeationPendingJobPlaceholder();
    return job ?? contentIdeationPendingJobPlaceholder();
  }
  if (job?.status === 'failed') return job;
  return null;
}
