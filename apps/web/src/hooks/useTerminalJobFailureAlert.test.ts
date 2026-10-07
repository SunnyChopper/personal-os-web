import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/personal-branding/report-job-failure', () => ({
  reportPersonalBrandingJobFailure: vi.fn(),
}));

import { reportPersonalBrandingJobFailure } from '@/lib/personal-branding/report-job-failure';
import type { TerminalJobFailureAlertInput } from './useTerminalJobFailureAlert';
import { useTerminalJobFailureAlert } from './useTerminalJobFailureAlert';

describe('useTerminalJobFailureAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports once when status becomes failed', () => {
    const { rerender } = renderHook(
      (props: TerminalJobFailureAlertInput) => useTerminalJobFailureAlert(props),
      {
        initialProps: {
          feature: 'contentStream',
          jobId: 'job-1',
          status: 'running',
          error: null,
        },
      }
    );

    rerender({
      feature: 'contentStream',
      jobId: 'job-1',
      status: 'failed',
      error: 'boom',
    });

    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledOnce();
    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'contentStream',
        jobId: 'job-1',
        error: 'boom',
      })
    );

    rerender({
      feature: 'contentStream',
      jobId: 'job-1',
      status: 'failed',
      error: 'boom again',
    });

    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledOnce();
  });

  it('reports partial warnings', () => {
    renderHook(() =>
      useTerminalJobFailureAlert({
        feature: 'brandProfileExtraction',
        jobId: 'job-2',
        status: 'succeeded_with_warnings',
        error: '2 sources failed',
      })
    );

    expect(reportPersonalBrandingJobFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        partial: true,
        feature: 'brandProfileExtraction',
      })
    );
  });
});
