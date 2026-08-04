import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client-telemetry', () => ({
  reportClientError: vi.fn(),
}));

import { reportClientError } from '@/lib/client-telemetry';
import {
  reportPersonalBrandingJobFailure,
  resetPersonalBrandingJobFailureReporterForTests,
} from './report-job-failure';

describe('reportPersonalBrandingJobFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPersonalBrandingJobFailureReporterForTests();
  });

  it('posts client error with personal-branding-job metadata', () => {
    reportPersonalBrandingJobFailure({
      feature: 'contentStream',
      jobId: 'job-1',
      error: 'resolve_vault_model() takes 0 positional arguments but 2 were given',
      stage: 'generating',
    });

    expect(reportClientError).toHaveBeenCalledOnce();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('contentStream'),
        source: 'web',
        metadata: expect.objectContaining({
          kind: 'personal-branding-job',
          feature: 'contentStream',
          jobId: 'job-1',
          stage: 'generating',
        }),
      })
    );
  });

  it('throttles duplicate reports for the same job within 60s', () => {
    reportPersonalBrandingJobFailure({
      feature: 'contentIdeation',
      jobId: 'job-2',
      error: 'boom',
    });
    reportPersonalBrandingJobFailure({
      feature: 'contentIdeation',
      jobId: 'job-2',
      error: 'boom again',
    });

    expect(reportClientError).toHaveBeenCalledOnce();
  });
});
