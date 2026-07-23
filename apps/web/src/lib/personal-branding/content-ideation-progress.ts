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
  { id: 'loading_context', label: 'Gathering context' },
] as const;

const REFERENCE_SEARCH_STEP: ContentIdeationPipelineStep = {
  id: 'searching_references',
  label: 'Searching published content',
};

const KEYWORD_RESEARCH_STEP: ContentIdeationPipelineStep = {
  id: 'waiting_keyword_research',
  label: 'Researching keywords',
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
  if (includeReferenceSearch) mid.push(REFERENCE_SEARCH_STEP);
  if (includeKeywordResearch) mid.push(KEYWORD_RESEARCH_STEP);
  return [...BASE_PIPELINE_STEPS, ...mid, ...TAIL_PIPELINE_STEPS];
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

export function contentIdeationStatusLabel(
  job: Pick<ContentIdeationJob, 'status' | 'message' | 'error'> | null | undefined
): string {
  if (!job) return 'Starting generation…';
  if (job.message?.trim()) return job.message;
  if (job.status === 'failed') return job.error ?? 'Content ideation failed';
  if (job.status === 'succeeded') return 'Content ideas generated';
  if (job.status === 'queued') return 'Queued for ideation';
  return 'Generating content ideas…';
}

export function contentIdeationJobInProgress(
  job: Pick<ContentIdeationJob, 'status'> | null | undefined
): boolean {
  return job?.status === 'queued' || job?.status === 'running';
}
