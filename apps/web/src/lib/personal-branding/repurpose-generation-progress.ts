import type {
  BrandPlatform,
  RepurposeJob,
  RepurposeJobStage,
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

export function repurposeJobGeneratingStatusLabel(
  job: RepurposeJob,
  stageLabels: Record<RepurposeJobStage, string>
): string {
  if (job.stage) {
    return stageLabels[job.stage] ?? job.stage;
  }
  return 'Generating…';
}

export function repurposeJobGeneratingDetailMessage(job: RepurposeJob): string | undefined {
  if (job.error && repurposeJobInFlight(job.status)) {
    return job.error;
  }
  return job.message ?? undefined;
}

export function repurposeSkeletonPlatforms(
  inFlightJobs: RepurposeJob[],
  variantPlatforms: Iterable<BrandPlatform>
): BrandPlatform[] {
  const existing = new Set(variantPlatforms);
  return inFlightJobs.filter((job) => !existing.has(job.platform)).map((job) => job.platform);
}
