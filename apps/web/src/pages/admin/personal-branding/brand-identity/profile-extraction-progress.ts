import type {
  ProfileExtractionClientProgress,
  ProfileExtractionJob,
  ProfileExtractionSourceType,
} from '@/types/api/personal-branding.dto';

export type ExtractionPipelineVariant = 'file' | 'x' | 'text';

export type ExtractionPipelineStep = {
  id: string;
  label: string;
};

export const FILE_EXTRACTION_PIPELINE_STEPS: readonly ExtractionPipelineStep[] = [
  { id: 'uploading', label: 'Uploading sources' },
  { id: 'queued', label: 'Queued' },
  { id: 'parsing_sources', label: 'Parsing PDFs' },
  { id: 'analyzing_sources', label: 'Analyzing chunks' },
  { id: 'reducing', label: 'Reducing evidence' },
  { id: 'saving', label: 'Saving profile' },
] as const;

export const X_EXTRACTION_PIPELINE_STEPS: readonly ExtractionPipelineStep[] = [
  { id: 'queued', label: 'Queued' },
  { id: 'parsing_sources', label: 'Fetching X timeline' },
  { id: 'analyzing_sources', label: 'Analyzing voice and pillars' },
  { id: 'reducing', label: 'Reducing evidence' },
  { id: 'saving', label: 'Saving profile' },
] as const;

export const TEXT_EXTRACTION_PIPELINE_STEPS: readonly ExtractionPipelineStep[] = [
  { id: 'queued', label: 'Queued' },
  { id: 'parsing_sources', label: 'Reading snippets' },
  { id: 'analyzing_sources', label: 'Analyzing voice and pillars' },
  { id: 'reducing', label: 'Reducing evidence' },
  { id: 'saving', label: 'Saving profile' },
] as const;

/** @deprecated Use extractionPipelineSteps(resolveExtractionPipelineVariant(...)) */
export const EXTRACTION_PIPELINE_STEPS = FILE_EXTRACTION_PIPELINE_STEPS;

export function resolveExtractionPipelineVariant(
  sourceTypes: ProfileExtractionSourceType[] | null | undefined
): ExtractionPipelineVariant {
  const types = sourceTypes ?? [];
  if (types.includes('pdf')) return 'file';
  if (types.includes('x_profile')) return 'x';
  return 'text';
}

export function extractionPipelineSteps(
  variant: ExtractionPipelineVariant
): readonly ExtractionPipelineStep[] {
  switch (variant) {
    case 'x':
      return X_EXTRACTION_PIPELINE_STEPS;
    case 'text':
      return TEXT_EXTRACTION_PIPELINE_STEPS;
    default:
      return FILE_EXTRACTION_PIPELINE_STEPS;
  }
}

export function resolveExtractionSourceTypes(
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): ProfileExtractionSourceType[] {
  if (job?.sourceTypes?.length) return job.sourceTypes;
  if (clientProgress?.sourceTypesHint?.length) return clientProgress.sourceTypesHint;
  if (clientProgress && clientProgress.filesTotal > 0) return ['pdf'];
  return [];
}

function stageIndex(
  stage: string | null | undefined,
  steps: readonly ExtractionPipelineStep[]
): number {
  if (!stage) return 0;
  const direct = steps.findIndex((step) => step.id === stage);
  if (direct >= 0) return direct;
  if (stage === 'reading_sources') {
    return steps.findIndex((step) => step.id === 'parsing_sources');
  }
  if (stage === 'analyzing') {
    return steps.findIndex((step) => step.id === 'analyzing_sources');
  }
  return 0;
}

function clientUploadRatio(progress: ProfileExtractionClientProgress): number {
  if (progress.bytesTotal > 0) {
    return Math.min(1, progress.bytesUploaded / progress.bytesTotal);
  }
  if (progress.filesTotal > 0) {
    return Math.min(1, progress.filesCompleted / progress.filesTotal);
  }
  return 0;
}

function clientUploadPercent(progress: ProfileExtractionClientProgress, stepCount: number): number {
  const uploadStepShare = 100 / stepCount;
  return Math.min(15, Math.round(clientUploadRatio(progress) * uploadStepShare));
}

export function isClientExtractionUploadActive(
  clientProgress: ProfileExtractionClientProgress | null | undefined
): boolean {
  return clientProgress != null && clientProgress.phase === 'uploading';
}

export function isClientExtractionPhaseActive(
  clientProgress: ProfileExtractionClientProgress | null | undefined
): boolean {
  return clientProgress != null && clientProgress.phase !== 'done';
}

export function extractionEffectiveStage(
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): string {
  if (clientProgress && clientProgress.phase !== 'done') {
    if (clientProgress.phase === 'uploading') return 'uploading';
    if (clientProgress.phase === 'registering_sources' || clientProgress.phase === 'starting') {
      return 'queued';
    }
  }

  return job?.stage ?? (job?.status === 'queued' ? 'queued' : 'reading_sources');
}

export function formatUploadProgressDetail(
  clientProgress: ProfileExtractionClientProgress | null | undefined
): string | null {
  if (!clientProgress || clientProgress.phase !== 'uploading') return null;

  const ratio = clientUploadRatio(clientProgress);
  const percent = Math.round(ratio * 100);

  if (clientProgress.filesTotal > 0) {
    return `Uploaded ${clientProgress.filesCompleted}/${clientProgress.filesTotal} · ${percent}%`;
  }

  return percent > 0 ? `Uploading… ${percent}%` : null;
}

export function extractionProgressPercent(
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): number {
  const sourceTypes = resolveExtractionSourceTypes(job, clientProgress);
  const variant = resolveExtractionPipelineVariant(sourceTypes);
  const steps = extractionPipelineSteps(variant);
  const stepCount = steps.length;
  const uploadStepShare = 100 / stepCount;

  if (!job && isClientExtractionUploadActive(clientProgress)) {
    return Math.max(1, clientUploadPercent(clientProgress!, stepCount));
  }

  if (isClientExtractionUploadActive(clientProgress)) {
    return Math.max(1, clientUploadPercent(clientProgress!, stepCount));
  }

  if (!job) return 5;

  const stage = job.stage ?? (job.status === 'queued' ? 'queued' : 'parsing_sources');

  if (
    stage === 'succeeded' ||
    job.status === 'succeeded' ||
    job.status === 'succeeded_with_warnings'
  ) {
    return 100;
  }
  if (stage === 'failed' || job.status === 'failed') return 100;

  if (
    clientProgress &&
    clientProgress.phase !== 'done' &&
    (clientProgress.phase === 'registering_sources' || clientProgress.phase === 'starting')
  ) {
    return Math.round(uploadStepShare);
  }

  const idx = stageIndex(stage, steps);
  const basePercent = (idx / stepCount) * 100;

  if (job.sourceCount && job.sourceCount > 0) {
    const sourceRatio = (job.processedSourceCount ?? 0) / job.sourceCount;
    return Math.min(95, Math.round(basePercent + sourceRatio * 25));
  }

  if (stage === 'reducing') return 82;
  if (stage === 'saving') return 92;
  if (stage === 'queued') {
    return variant === 'file'
      ? Math.round(uploadStepShare + 2)
      : Math.max(5, Math.round(basePercent + 8));
  }
  if (stage === 'uploading') return Math.max(1, Math.round(uploadStepShare / 2));

  return Math.min(95, Math.round(basePercent + 15));
}

export function extractionStatusLabel(
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): string {
  const sourceTypes = resolveExtractionSourceTypes(job, clientProgress);
  const variant = resolveExtractionPipelineVariant(sourceTypes);

  if (clientProgress?.phase === 'uploading') {
    const ratio = clientUploadRatio(clientProgress);
    const percent = Math.round(ratio * 100);
    if (clientProgress.filesTotal > 0) {
      return `Uploading sources — ${clientProgress.filesCompleted}/${clientProgress.filesTotal} files (${percent}%)`;
    }
    return 'Uploading sources';
  }

  if (clientProgress?.phase === 'registering_sources') {
    if (variant === 'x') {
      return 'Registering X profile source';
    }
    return 'Registering text snippets and sources';
  }

  if (clientProgress?.phase === 'starting') {
    return 'Starting extraction pipeline…';
  }

  if (!job) return 'Starting extraction…';
  if (job.message?.trim()) return job.message;
  if (job.status === 'succeeded_with_warnings') {
    return 'Profile saved with warnings — some sources could not be analyzed';
  }
  switch (job.stage) {
    case 'queued':
      return 'Queued — preparing your sources';
    case 'uploading':
      return 'Uploading sources';
    case 'reading_sources':
    case 'parsing_sources':
      if (variant === 'x') return 'Fetching X timeline';
      if (variant === 'text') return 'Reading snippets';
      return 'Parsing PDFs and snippets';
    case 'analyzing_sources':
    case 'analyzing':
      return variant === 'file'
        ? 'Analyzing voice, pillars, and tone with LLM'
        : 'Analyzing voice, pillars, and tone';
    case 'reducing':
      return 'Reducing source evidence';
    case 'saving':
      return 'Saving extracted profile';
    case 'failed':
      return 'Extraction failed';
    case 'succeeded':
      return 'Profile extraction complete';
    default:
      return job.status === 'running' ? 'Running extraction' : job.status;
  }
}

export function extractionIsTerminal(job: ProfileExtractionJob | undefined): boolean {
  if (!job) return false;
  return (
    job.status === 'succeeded' ||
    job.status === 'succeeded_with_warnings' ||
    job.status === 'failed'
  );
}
