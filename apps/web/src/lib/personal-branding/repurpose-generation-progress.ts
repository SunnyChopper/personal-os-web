import type {
  BrandPlatform,
  RepurposeJob,
  RepurposeJobStatus,
} from '@/types/api/personal-branding.dto';

export const IN_FLIGHT_REPURPOSE_JOB_STATUSES: RepurposeJobStatus[] = [
  'queued',
  'running',
  'cancelling',
];

export function repurposeJobInFlight(status: RepurposeJobStatus): boolean {
  return IN_FLIGHT_REPURPOSE_JOB_STATUSES.includes(status);
}

export function hasInFlightRepurposeJobs(jobs: RepurposeJob[] | undefined): boolean {
  return (jobs ?? []).some((job) => repurposeJobInFlight(job.status));
}

export function repurposeGenerationBatchJobs(
  repurposeJobs: RepurposeJob[],
  inFlightJobs: RepurposeJob[]
): RepurposeJob[] {
  if (inFlightJobs.length === 0) return [];
  const batchStart = inFlightJobs.reduce(
    (min, job) => (job.createdAt < min ? job.createdAt : min),
    inFlightJobs[0].createdAt
  );
  return repurposeJobs.filter((job) => job.createdAt >= batchStart);
}

export function repurposeBatchProgress(batchJobs: RepurposeJob[]): {
  total: number;
  completed: number;
  inFlightCount: number;
  percent: number;
} {
  const total = batchJobs.length;
  if (total === 0) {
    return { total: 0, completed: 0, inFlightCount: 0, percent: 0 };
  }
  const completed = batchJobs.filter(
    (job) => job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled'
  ).length;
  const inFlightCount = batchJobs.filter((job) => repurposeJobInFlight(job.status)).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, inFlightCount, percent };
}

export function repurposeGenerationBannerLabel(inFlightCount: number): string {
  return inFlightCount === 1 ? 'Generating 1 variant…' : `Generating ${inFlightCount} variants…`;
}

export function repurposeSkeletonPlatforms(
  inFlightJobs: RepurposeJob[],
  variantPlatforms: Iterable<BrandPlatform>
): BrandPlatform[] {
  const existing = new Set(variantPlatforms);
  return inFlightJobs.filter((job) => !existing.has(job.platform)).map((job) => job.platform);
}
