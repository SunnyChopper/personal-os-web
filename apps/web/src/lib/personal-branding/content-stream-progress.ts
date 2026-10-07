import type { ContentStreamJob } from '@/types/api/personal-branding.dto';

export type ContentStreamJobStage =
  | 'queued'
  | 'gathering_context'
  | 'generating'
  | 'succeeded'
  | 'failed';

export type ContentStreamPipelineStep = {
  id: ContentStreamJobStage;
  label: string;
};

export const CONTENT_STREAM_PIPELINE_STEPS: readonly ContentStreamPipelineStep[] = [
  { id: 'queued', label: 'Queued' },
  { id: 'gathering_context', label: 'Gathering context' },
  { id: 'generating', label: 'Generating posts' },
] as const;

const TERMINAL_STAGE_IDS = new Set<ContentStreamJobStage>(['succeeded', 'failed']);

function stageIndex(
  stage: string | null | undefined,
  steps: readonly ContentStreamPipelineStep[]
): number {
  if (!stage) return 0;
  if (TERMINAL_STAGE_IDS.has(stage as ContentStreamJobStage)) {
    return steps.length - 1;
  }
  const direct = steps.findIndex((step) => step.id === stage);
  if (direct >= 0) return direct;
  return 0;
}

export function contentStreamProgressPercent(
  job: Pick<ContentStreamJob, 'status' | 'stage'> | null | undefined
): number {
  const steps = CONTENT_STREAM_PIPELINE_STEPS;
  if (!job) return 0;
  if (job.status === 'succeeded') return 100;
  if (job.status === 'failed') {
    const idx = stageIndex(job.stage, steps);
    return Math.max(8, Math.round(((idx + 0.5) / steps.length) * 100));
  }
  const idx = stageIndex(job.stage, steps);
  return Math.min(95, Math.round(((idx + 0.35) / steps.length) * 100));
}

export function contentStreamStatusLabel(
  job: Pick<ContentStreamJob, 'status' | 'stage' | 'message' | 'error'> | null | undefined
): string {
  if (!job) return 'Starting generation…';
  if (job.message?.trim()) return job.message;
  if (job.status === 'failed') return job.error ?? 'Content stream generation failed';
  if (job.status === 'succeeded') return 'Short posts generated';
  if (job.stage === 'gathering_context') {
    return 'Loading brand, X, Live Now, Recon Feed, Trend Stream, and Growth achievements';
  }
  if (job.stage === 'generating') return 'Generating short posts…';
  if (job.status === 'queued' || job.stage === 'queued') return 'Queued for generation';
  return 'Generating short posts…';
}

export function contentStreamJobInProgress(
  job: Pick<ContentStreamJob, 'status'> | null | undefined
): boolean {
  return job?.status === 'queued' || job?.status === 'running';
}

/** Job payload for slim progress strip while submit is in-flight but poll job not yet returned. */
export function contentStreamPendingJobPlaceholder(): ContentStreamJob {
  return {
    jobId: 'pending',
    status: 'queued',
    createdPostIds: [],
    userId: '',
    createdAt: '',
    updatedAt: '',
    pollAfterMs: 2000,
  };
}

/** Progress strip owns the primary CTA slot (hide Generate) while queued/running or awaiting poll. */
export function contentStreamCtaProgressOnly(
  job: Pick<ContentStreamJob, 'status'> | null | undefined,
  isSubmitting: boolean
): boolean {
  return contentStreamJobInProgress(job) || isSubmitting;
}

export function contentStreamProgressPanelJob(
  job: ContentStreamJob | null | undefined,
  isSubmitting: boolean
): ContentStreamJob | null {
  if (contentStreamJobInProgress(job)) return job ?? null;
  if (isSubmitting) {
    if (job?.status === 'failed') return contentStreamPendingJobPlaceholder();
    return job ?? contentStreamPendingJobPlaceholder();
  }
  if (job?.status === 'failed') return job;
  return null;
}
