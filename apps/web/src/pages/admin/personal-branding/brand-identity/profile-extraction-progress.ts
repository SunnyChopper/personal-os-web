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

type StageBand = {
  id: string;
  weight: number;
};

const FILE_STAGE_BANDS: readonly StageBand[] = [
  { id: 'uploading', weight: 8 },
  { id: 'queued', weight: 4 },
  { id: 'parsing_sources', weight: 12 },
  { id: 'analyzing_sources', weight: 55 },
  { id: 'reducing', weight: 12 },
  { id: 'saving', weight: 9 },
];

export type ExtractionMetrics = {
  sources: {
    processed: number;
    total: number;
    succeeded: number;
    failed: number;
  } | null;
  chunks: {
    processed: number;
    total: number;
  } | null;
  chunksPendingDiscovery: boolean;
};

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function stageBandsForVariant(variant: ExtractionPipelineVariant): StageBand[] {
  const bands =
    variant === 'file'
      ? [...FILE_STAGE_BANDS]
      : FILE_STAGE_BANDS.filter((band) => band.id !== 'uploading');
  const totalWeight = bands.reduce((sum, band) => sum + band.weight, 0);
  return bands.map((band) => ({
    id: band.id,
    weight: (band.weight / totalWeight) * 100,
  }));
}

function normalizeProgressStage(stage: string | null | undefined): string {
  if (!stage) return 'queued';
  if (stage === 'reading_sources') return 'parsing_sources';
  if (stage === 'analyzing') return 'saving';
  return stage;
}

function bandIndex(stageId: string, bands: readonly StageBand[]): number {
  const direct = bands.findIndex((band) => band.id === stageId);
  if (direct >= 0) return direct;
  return 0;
}

function intraBandRatio(
  stageId: string,
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): number {
  if (stageId === 'uploading') {
    if (!clientProgress || clientProgress.phase !== 'uploading') return 0;
    return clientUploadRatio(clientProgress);
  }
  if (stageId === 'queued' || stageId === 'parsing_sources') return 0;
  if (stageId === 'analyzing_sources') {
    const totalChunks = job?.totalChunkCount ?? 0;
    const processedChunks = job?.processedChunkCount ?? 0;
    if (totalChunks > 0) {
      return clampRatio(processedChunks / totalChunks);
    }
    const sourceCount = job?.sourceCount ?? 0;
    if (sourceCount > 0) {
      return clampRatio((job?.processedSourceCount ?? 0) / sourceCount);
    }
    return 0;
  }
  if (stageId === 'reducing') return 0.5;
  if (stageId === 'saving') return 0.85;
  return 0;
}

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

function clientUploadRatio(progress: ProfileExtractionClientProgress): number {
  if (progress.bytesTotal > 0) {
    return clampRatio(progress.bytesUploaded / progress.bytesTotal);
  }
  if (progress.filesTotal > 0) {
    return clampRatio(progress.filesCompleted / progress.filesTotal);
  }
  return 0;
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

  const rawStage = job?.stage ?? (job?.status === 'queued' ? 'queued' : 'parsing_sources');
  return normalizeProgressStage(rawStage);
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

export function formatExtractionMetrics(job: ProfileExtractionJob | undefined): ExtractionMetrics {
  if (job?.sourceCount == null) {
    return { sources: null, chunks: null, chunksPendingDiscovery: false };
  }

  const sources = {
    processed: job.processedSourceCount ?? 0,
    total: job.sourceCount,
    succeeded: job.succeededSourceCount ?? 0,
    failed: job.failedSourceCount ?? 0,
  };

  const totalChunks = job.totalChunkCount ?? 0;
  const processedChunks = job.processedChunkCount ?? 0;
  const stage = normalizeProgressStage(job.stage);
  const chunksPendingDiscovery =
    stage === 'analyzing_sources' && totalChunks <= 0 && sources.processed < sources.total;

  return {
    sources,
    chunks: totalChunks > 0 ? { processed: processedChunks, total: totalChunks } : null,
    chunksPendingDiscovery,
  };
}

export function extractionStepCaption(
  stepId: string,
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): string | null {
  const currentStage = extractionEffectiveStage(job, clientProgress);
  if (stepId !== currentStage) return null;

  if (stepId === 'uploading') {
    return formatUploadProgressDetail(clientProgress);
  }

  const metrics = formatExtractionMetrics(job);
  if (!metrics.sources) return null;

  if (stepId === 'analyzing_sources') {
    if (metrics.chunks) {
      return `${metrics.chunks.processed} of ${metrics.chunks.total} chunks analyzed`;
    }
    if (metrics.chunksPendingDiscovery) {
      return 'Discovering chunks across sources…';
    }
    if (metrics.sources.total > 0) {
      return `${metrics.sources.processed} of ${metrics.sources.total} sources complete`;
    }
  }

  if (stepId === 'parsing_sources' && metrics.sources.total > 0) {
    return `Preparing ${metrics.sources.total} sources`;
  }

  return null;
}

export function extractionProgressPercent(
  job: ProfileExtractionJob | undefined,
  clientProgress?: ProfileExtractionClientProgress | null
): number {
  const sourceTypes = resolveExtractionSourceTypes(job, clientProgress);
  const variant = resolveExtractionPipelineVariant(sourceTypes);
  const bands = stageBandsForVariant(variant);

  if (!job && isClientExtractionUploadActive(clientProgress)) {
    const uploadBand = bands.find((band) => band.id === 'uploading');
    const weight = uploadBand?.weight ?? bands[0]?.weight ?? 8;
    return Math.max(1, Math.round(clientUploadRatio(clientProgress!) * weight));
  }

  if (isClientExtractionUploadActive(clientProgress)) {
    const uploadBand = bands.find((band) => band.id === 'uploading');
    const weight = uploadBand?.weight ?? bands[0]?.weight ?? 8;
    return Math.max(1, Math.round(clientUploadRatio(clientProgress!) * weight));
  }

  if (!job) return 5;

  const rawStage = job.stage ?? (job.status === 'queued' ? 'queued' : 'parsing_sources');

  if (
    rawStage === 'succeeded' ||
    job.status === 'succeeded' ||
    job.status === 'succeeded_with_warnings'
  ) {
    return 100;
  }
  if (rawStage === 'failed' || job.status === 'failed') return 100;
  if (job.status === 'cancelled' || rawStage === 'cancelled') return 0;
  if (job.status === 'cancelling' || rawStage === 'cancelling') {
    return Math.min(95, Math.round(bands[0]?.weight ?? 4));
  }

  if (
    clientProgress &&
    clientProgress.phase !== 'done' &&
    (clientProgress.phase === 'registering_sources' || clientProgress.phase === 'starting')
  ) {
    const queuedBand = bands.find((band) => band.id === 'queued');
    return Math.round(queuedBand?.weight ?? 4);
  }

  const stageId = normalizeProgressStage(rawStage);
  const idx = bandIndex(stageId, bands);
  const completedWeight = bands.slice(0, idx).reduce((sum, band) => sum + band.weight, 0);
  const currentBand = bands[idx];
  const intra = intraBandRatio(stageId, job, clientProgress);
  const percent = completedWeight + (currentBand?.weight ?? 0) * intra;

  return Math.min(95, Math.round(percent));
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
    case 'cancelling':
      return 'Cancelling extraction…';
    case 'cancelled':
      return 'Extraction cancelled';
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
    job.status === 'failed' ||
    job.status === 'cancelled'
  );
}
