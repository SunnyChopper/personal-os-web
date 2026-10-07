import { describe, expect, it } from 'vitest';
import {
  contentIdeationCtaProgressOnly,
  contentIdeationPipelineSteps,
  contentIdeationProgressPanelJob,
  contentIdeationStatusLabel,
  keywordResearchStageLabel,
  personalBrandingJobFailureMessage,
} from './content-ideation-progress';
import { contentIdeationClientWaitBudgetMs } from '@/hooks/useContentIdeationJob';

describe('content-ideation-progress', () => {
  it('places keyword research before loading context when Medium path', () => {
    const steps = contentIdeationPipelineSteps(false, true);
    const keywordIdx = steps.findIndex((s) => s.id === 'waiting_keyword_research');
    const contextIdx = steps.findIndex((s) => s.id === 'loading_context');
    expect(keywordIdx).toBeGreaterThan(-1);
    expect(contextIdx).toBeGreaterThan(keywordIdx);
  });

  it('maps keyword research substages for UI', () => {
    expect(keywordResearchStageLabel('accumulating')).toBe('Batching keywords for DataForSEO');
    expect(keywordResearchStageLabel('waiting')).toBe('Waiting on DataForSEO results');
  });

  it('appends retry hint when job is retryable', () => {
    expect(
      personalBrandingJobFailureMessage(
        { error: 'Provider rate limited', retryable: true },
        'Failed'
      )
    ).toBe('Provider rate limited You can retry.');
    expect(
      contentIdeationStatusLabel({
        status: 'failed',
        error: 'No new ideas',
        errorCode: 'BANNED_ONLY_BATCH',
        retryable: false,
      })
    ).toBe('No new ideas');
  });
});

describe('useContentIdeationJob budgets', () => {
  it('extends poll budget when keyword wait is observed', () => {
    expect(contentIdeationClientWaitBudgetMs(null, false)).toBe(5 * 60 * 1000);
    expect(
      contentIdeationClientWaitBudgetMs(
        { stage: 'waiting_keyword_research', keywordResearchStage: null },
        false
      )
    ).toBe(28 * 60 * 1000);
    expect(
      contentIdeationClientWaitBudgetMs(
        { stage: 'generating', keywordResearchStage: 'waiting' },
        true
      )
    ).toBe(28 * 60 * 1000);
  });
});

describe('contentIdeationCtaProgressOnly', () => {
  it('owns CTA slot while queued/running or awaiting first poll', () => {
    expect(contentIdeationCtaProgressOnly({ status: 'running' }, false)).toBe(true);
    expect(contentIdeationCtaProgressOnly({ status: 'failed' }, true)).toBe(true);
    expect(contentIdeationCtaProgressOnly(null, true)).toBe(true);
    expect(contentIdeationProgressPanelJob(null, true)?.status).toBe('queued');
    expect(
      contentIdeationProgressPanelJob(
        { status: 'failed', jobId: 'x', userId: '', createdAt: '', updatedAt: '' },
        true
      )?.status
    ).toBe('queued');
  });
});
