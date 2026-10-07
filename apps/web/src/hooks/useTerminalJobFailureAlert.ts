/**
 * Fire reportPersonalBrandingJobFailure once when a polled job reaches a terminal failure state.
 */
import { useEffect, useRef } from 'react';
import {
  reportPersonalBrandingJobFailure,
  type PersonalBrandingJobFeature,
} from '@/lib/personal-branding/report-job-failure';

export interface TerminalJobFailureAlertInput {
  feature: PersonalBrandingJobFeature;
  jobId: string | null | undefined;
  status: string | null | undefined;
  error?: string | null;
  message?: string | null;
  stage?: string | null;
  errorCode?: string | null;
  retryable?: boolean | null;
  partial?: boolean;
}

export function useTerminalJobFailureAlert(input: TerminalJobFailureAlertInput): void {
  const { feature, jobId, status, error, message, stage, errorCode, retryable, partial } = input;
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const normalized = String(status ?? '').toLowerCase();
    const isFailed = normalized === 'failed';
    const isPartial =
      partial ??
      (normalized === 'succeeded_with_warnings' ||
        normalized === 'partial' ||
        normalized === 'succeededwithwarnings');
    if (!isFailed && !isPartial) return;
    const key = `${feature}:${jobId}:${isPartial ? 'partial' : 'failed'}`;
    if (reportedRef.current === key) return;
    reportedRef.current = key;
    reportPersonalBrandingJobFailure({
      feature,
      jobId,
      error,
      message,
      stage,
      errorCode,
      retryable,
      partial: isPartial,
    });
  }, [feature, jobId, status, error, message, stage, errorCode, retryable, partial]);
}

export function reportTerminalJobClientTimeout(
  feature: PersonalBrandingJobFeature,
  jobId: string,
  timeoutMs: number
): void {
  reportPersonalBrandingJobFailure({
    feature,
    jobId,
    error: `Client poll stopped after ${timeoutMs}ms without terminal status`,
    stage: 'client_timeout',
  });
}
