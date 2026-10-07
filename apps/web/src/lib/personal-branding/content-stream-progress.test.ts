import { describe, expect, it } from 'vitest';
import {
  contentStreamCtaProgressOnly,
  contentStreamJobInProgress,
  contentStreamPendingJobPlaceholder,
  contentStreamProgressPanelJob,
  contentStreamProgressPercent,
  contentStreamStatusLabel,
} from './content-stream-progress';

describe('contentStreamProgressPercent', () => {
  it('returns 0 for null job', () => {
    expect(contentStreamProgressPercent(null)).toBe(0);
    expect(contentStreamProgressPercent(undefined)).toBe(0);
  });

  it('maps in-flight stages to stable percent bands', () => {
    expect(contentStreamProgressPercent({ status: 'queued', stage: 'queued' })).toBe(12);
    expect(contentStreamProgressPercent({ status: 'running', stage: 'gathering_context' })).toBe(
      45
    );
    expect(contentStreamProgressPercent({ status: 'running', stage: 'generating' })).toBe(78);
  });

  it('returns 100 on succeeded status', () => {
    expect(contentStreamProgressPercent({ status: 'succeeded', stage: 'succeeded' })).toBe(100);
  });

  it('clamps failed status with stage=failed to last in-flight band', () => {
    expect(contentStreamProgressPercent({ status: 'failed', stage: 'failed' })).toBe(83);
  });

  it('maps failed status at gathering_context to mid-band', () => {
    expect(contentStreamProgressPercent({ status: 'failed', stage: 'gathering_context' })).toBe(50);
  });

  it('falls back to queued band for unknown stage', () => {
    expect(contentStreamProgressPercent({ status: 'running', stage: 'unknown_stage' })).toBe(12);
  });
});

describe('contentStreamStatusLabel', () => {
  it('prefers live message from poll', () => {
    expect(
      contentStreamStatusLabel({
        status: 'running',
        message: 'Generating 3 X short posts with profile Acme',
      })
    ).toBe('Generating 3 X short posts with profile Acme');
  });

  it('falls back to error on failed', () => {
    expect(
      contentStreamStatusLabel({
        status: 'failed',
        error: 'Daily budget exhausted',
      })
    ).toBe('Daily budget exhausted');
  });
});

describe('contentStreamJobInProgress', () => {
  it('is true for queued and running', () => {
    expect(contentStreamJobInProgress({ status: 'queued' })).toBe(true);
    expect(contentStreamJobInProgress({ status: 'running' })).toBe(true);
    expect(contentStreamJobInProgress({ status: 'succeeded' })).toBe(false);
    expect(contentStreamJobInProgress({ status: 'failed' })).toBe(false);
    expect(contentStreamJobInProgress(null)).toBe(false);
  });
});

describe('contentStreamCtaProgressOnly', () => {
  it('shows progress strip while in-flight or submitting', () => {
    expect(contentStreamCtaProgressOnly({ status: 'running' }, false)).toBe(true);
    expect(contentStreamCtaProgressOnly({ status: 'failed' }, true)).toBe(true);
    expect(contentStreamCtaProgressOnly(null, true)).toBe(true);
    expect(contentStreamProgressPanelJob(null, true)?.status).toBe('queued');
    expect(
      contentStreamProgressPanelJob(
        {
          status: 'failed',
          jobId: 'x',
          userId: '',
          createdAt: '',
          updatedAt: '',
          createdPostIds: [],
        },
        true
      )?.status
    ).toBe('queued');
    expect(contentStreamCtaProgressOnly({ status: 'succeeded' }, false)).toBe(false);
  });
});

describe('contentStreamPendingJobPlaceholder', () => {
  it('returns queued placeholder job', () => {
    expect(contentStreamPendingJobPlaceholder().status).toBe('queued');
    expect(contentStreamPendingJobPlaceholder().jobId).toBe('pending');
  });
});
