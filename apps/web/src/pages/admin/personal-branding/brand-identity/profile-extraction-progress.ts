import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

const EXTRACTION_PIPELINE_STEPS = [
  { id: 'queued', label: 'Queued' },
  { id: 'uploading', label: 'Uploading sources' },
  { id: 'parsing_sources', label: 'Parsing PDFs' },
  { id: 'analyzing_sources', label: 'Analyzing chunks' },
  { id: 'reducing', label: 'Reducing evidence' },
  { id: 'saving', label: 'Saving profile' },
] as const;

export { EXTRACTION_PIPELINE_STEPS };

function stageIndex(stage: string | null | undefined): number {
  if (!stage) return 0;
  const direct = EXTRACTION_PIPELINE_STEPS.findIndex((step) => step.id === stage);
  if (direct >= 0) return direct;
  if (stage === 'reading_sources') return 1;
  if (stage === 'analyzing') return 3;
  return 0;
}

export function extractionProgressPercent(job: ProfileExtractionJob | undefined): number {
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

  const idx = stageIndex(stage);
  const basePercent = (idx / EXTRACTION_PIPELINE_STEPS.length) * 100;

  if (job.sourceCount && job.sourceCount > 0) {
    const sourceRatio = (job.processedSourceCount ?? 0) / job.sourceCount;
    return Math.min(95, Math.round(basePercent + sourceRatio * 25));
  }

  if (stage === 'reducing') return 82;
  if (stage === 'saving') return 92;
  if (stage === 'queued' || stage === 'uploading') return 8;

  return Math.min(95, Math.round(basePercent + 15));
}

export function extractionStatusLabel(job: ProfileExtractionJob | undefined): string {
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
      return 'Parsing PDFs and snippets';
    case 'analyzing_sources':
    case 'analyzing':
      return 'Analyzing voice, pillars, and tone with LLM';
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
