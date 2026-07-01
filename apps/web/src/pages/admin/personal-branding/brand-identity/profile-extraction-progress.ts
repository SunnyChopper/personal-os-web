import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';

const EXTRACTION_PIPELINE_STEPS = [
  { id: 'queued', label: 'Queued' },
  { id: 'reading_sources', label: 'Reading sources' },
  { id: 'analyzing', label: 'Analyzing with LLM' },
  { id: 'saving', label: 'Saving profile' },
] as const;

export { EXTRACTION_PIPELINE_STEPS };

export function extractionProgressPercent(job: ProfileExtractionJob | undefined): number {
  if (!job) return 5;

  const stage = job.stage ?? (job.status === 'queued' ? 'queued' : 'reading_sources');

  if (stage === 'succeeded') return 100;
  if (stage === 'failed') return 100;

  const stageIndex = EXTRACTION_PIPELINE_STEPS.findIndex((step) => step.id === stage);
  const basePercent = stageIndex >= 0 ? (stageIndex / EXTRACTION_PIPELINE_STEPS.length) * 100 : 10;

  if (stage === 'reading_sources' && job.sourceCount && job.sourceCount > 0) {
    const sourceRatio = (job.processedSourceCount ?? 0) / job.sourceCount;
    return Math.min(95, Math.round(15 + sourceRatio * 35));
  }

  if (stage === 'analyzing') return 72;
  if (stage === 'saving') return 90;
  if (stage === 'queued') return 8;

  return Math.min(95, Math.round(basePercent + 20));
}

export function extractionStatusLabel(job: ProfileExtractionJob | undefined): string {
  if (!job) return 'Starting extraction…';
  if (job.message?.trim()) return job.message;
  switch (job.stage) {
    case 'queued':
      return 'Queued — preparing your sources';
    case 'reading_sources':
      return 'Reading PDFs and pasted snippets';
    case 'analyzing':
      return 'Analyzing voice, pillars, and tone with LLM';
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
