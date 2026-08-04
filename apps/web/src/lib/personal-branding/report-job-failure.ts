/**
 * Report terminal Personal Branding async job failures to the alert pipeline.
 */
import { reportClientError } from '@/lib/client-telemetry';

const THROTTLE_MS = 60_000;
const _lastSentAt = new Map<string, number>();

export type PersonalBrandingJobFeature =
  | 'contentStream'
  | 'contentIdeation'
  | 'contentIdeaApprove'
  | 'contentImageInject'
  | 'contentKeywordOptimize'
  | 'contentTemplateAi'
  | 'contentRepurpose'
  | 'radarDiscovery'
  | 'radarIdeation'
  | 'brandProfileExtraction'
  | 'radarIngest'
  | 'radarDiscoveryParse'
  | 'reconFeed'
  | 'rolodexReply';

export interface ReportPersonalBrandingJobFailureInput {
  feature: PersonalBrandingJobFeature;
  jobId: string;
  error?: string | null;
  message?: string | null;
  stage?: string | null;
  /** Partial success (e.g. succeeded_with_warnings) — still alertable */
  partial?: boolean;
}

export function resetPersonalBrandingJobFailureReporterForTests(): void {
  _lastSentAt.clear();
}

export function reportPersonalBrandingJobFailure(
  input: ReportPersonalBrandingJobFailureInput
): void {
  const { feature, jobId, error, message, stage, partial } = input;
  const throttleKey = `${feature}:${jobId}`;
  const now = Date.now();
  const last = _lastSentAt.get(throttleKey) ?? 0;
  if (now - last < THROTTLE_MS) return;
  _lastSentAt.set(throttleKey, now);

  const detail = error ?? message ?? (partial ? 'Job completed with warnings' : 'Job failed');
  void reportClientError({
    message: `Personal Branding ${feature} job ${partial ? 'partial failure' : 'failed'}: ${detail}`,
    source: 'web',
    metadata: {
      kind: 'personal-branding-job',
      feature,
      jobId,
      stage: stage ?? undefined,
      error: error ?? undefined,
      partial: partial ?? false,
    },
  });
}
