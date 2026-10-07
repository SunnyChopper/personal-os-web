import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client-telemetry', () => ({
  reportClientError: vi.fn(),
}));

import { reportClientError } from '@/lib/client-telemetry';
import {
  reportMutationCacheError,
  reportQueryCacheError,
  resetQueryErrorReporterForTests,
  shouldSkipQueryCacheErrorReport,
  shouldSkipQueryErrorReport,
} from '@/lib/report-query-error';

describe('report-query-error', () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetQueryErrorReporterForTests();
  });

  it('skips HTTP_401', () => {
    expect(shouldSkipQueryErrorReport('HTTP_401')).toBe(true);
    reportQueryCacheError({ message: 'unauthorized', code: 'HTTP_401' }, ['tasks']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('reports query failure with metadata', () => {
    reportQueryCacheError(new Error('Request failed'), ['chatbot', 'context']);
    expect(reportClientError).toHaveBeenCalledOnce();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('React Query failed'),
        metadata: expect.objectContaining({
          kind: 'react-query',
          queryKey: expect.stringContaining('chatbot'),
        }),
      })
    );
  });

  it('throttles duplicate fingerprint within 60s', () => {
    const err = new Error('same failure');
    reportQueryCacheError(err, ['dup']);
    reportQueryCacheError(err, ['dup']);
    expect(reportClientError).toHaveBeenCalledOnce();
  });

  it('reports mutation failures', () => {
    reportMutationCacheError(new Error('save failed'), ['save-task']);
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ kind: 'react-mutation' }),
      })
    );
  });

  it('skips Content Stream daily budget exhausted mutation telemetry (266fcbd78690)', () => {
    const err = new Error(
      'Daily post budget exhausted; try again tomorrow or use force'
    ) as Error & { code?: string };
    err.code = 'HTTP_400';
    expect(shouldSkipQueryErrorReport(err.code, err.message)).toBe(true);
    reportMutationCacheError(err, ['personal-branding', 'content-stream', 'generate', 'x']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips budget exhausted when message includes Code line from formatApiFailure', () => {
    const err = new Error(
      'Daily post budget exhausted; try again tomorrow or use force\nCode: HTTP_400'
    );
    expect(shouldSkipQueryErrorReport(undefined, err.message)).toBe(true);
    reportMutationCacheError(err, ['personal-branding', 'content-stream', 'generate', 'x']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips cost guardrail denial mutation telemetry', () => {
    const err = new Error(
      "Cost guardrail: personal_branding daily budget exceeded ($6.00 / $5.00). Feature 'contentIdeation' is paused until the period resets or you resume from Observability → Cost."
    ) as Error & { code?: string };
    err.code = 'HTTP_400';
    expect(shouldSkipQueryErrorReport(err.code, err.message)).toBe(true);
    reportMutationCacheError(err, ['personal-branding', 'content-ideas', 'generate']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips context-usage ETIMEDOUT telemetry', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    expect(
      shouldSkipQueryCacheErrorReport(
        ['chatbot', 'context-usage', 'thread-1', 'msg-1'],
        'ETIMEDOUT',
        err.message
      )
    ).toBe(true);
    reportQueryCacheError(err, ['chatbot', 'context-usage', 'thread-1', 'msg-1']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips shell badge ETIMEDOUT telemetry', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    expect(
      shouldSkipQueryCacheErrorReport(
        ['chatbot', 'interventions', 'unread-count'],
        'ETIMEDOUT',
        err.message
      )
    ).toBe(true);
    expect(
      shouldSkipQueryCacheErrorReport(['chatbot', 'unread-summary'], 'ETIMEDOUT', err.message)
    ).toBe(true);
    expect(
      shouldSkipQueryCacheErrorReport(
        ['chatbot', 'coach-escalations', 'pending'],
        'ETIMEDOUT',
        err.message
      )
    ).toBe(true);
    reportQueryCacheError(err, ['chatbot', 'interventions', 'unread-count']);
    reportQueryCacheError(err, ['chatbot', 'unread-summary']);
    reportQueryCacheError(err, ['chatbot', 'coach-escalations', 'pending']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips ambient whisper ETIMEDOUT telemetry (8b25dbe8c269)', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    expect(
      shouldSkipQueryCacheErrorReport(
        ['chatbot', 'ambient', 'growthTasks'],
        'ETIMEDOUT',
        err.message
      )
    ).toBe(true);
    expect(
      shouldSkipQueryCacheErrorReport(['chatbot', 'ambient', 'dashboard'], 'ETIMEDOUT', err.message)
    ).toBe(true);
    reportQueryCacheError(err, ['chatbot', 'ambient', 'growthTasks']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips platform-rules catalog timeout telemetry (aafeaa15dfe7)', () => {
    const err = new Error('Request timed out. The server may be slow or unavailable.');
    expect(
      shouldSkipQueryCacheErrorReport(
        ['personal-branding', 'platform-rules', 'catalog'],
        undefined,
        err.message
      )
    ).toBe(true);
    reportQueryCacheError(err, ['personal-branding', 'platform-rules', 'catalog']);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('skips unobserved timeout telemetry after navigate-away (a98591bd8564)', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    expect(
      shouldSkipQueryCacheErrorReport(
        ['personal-branding', 'profiles', 'list', 1, 50],
        'ETIMEDOUT',
        err.message,
        { observerCount: 0 }
      )
    ).toBe(true);
    reportQueryCacheError(err, ['personal-branding', 'profiles', 'list', 1, 50], {
      observerCount: 0,
    });
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('still reports observed personal-branding profile list ETIMEDOUT', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    reportQueryCacheError(err, ['personal-branding', 'profiles', 'list', 1, 50], {
      observerCount: 1,
    });
    expect(reportClientError).toHaveBeenCalledOnce();
  });

  it('skips unobserved profile detail timeout telemetry (a897a4d7994c)', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    expect(
      shouldSkipQueryCacheErrorReport(
        ['personal-branding', 'profiles', 'detail', '01kxmjqpqsk6z4dcvec80fn8ch'],
        'ETIMEDOUT',
        err.message,
        { observerCount: 0 }
      )
    ).toBe(true);
    reportQueryCacheError(
      err,
      ['personal-branding', 'profiles', 'detail', '01kxmjqpqsk6z4dcvec80fn8ch'],
      { observerCount: 0 }
    );
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('still reports observed personal-branding profile detail ETIMEDOUT', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    reportQueryCacheError(err, ['personal-branding', 'profiles', 'detail', 'profile-1'], {
      observerCount: 1,
    });
    expect(reportClientError).toHaveBeenCalledOnce();
  });

  it('still reports unrelated query ETIMEDOUT', () => {
    const err = Object.assign(
      new Error('Request timed out. The server may be slow or unavailable.'),
      { code: 'ETIMEDOUT' }
    );
    reportQueryCacheError(err, ['tasks', 'list']);
    expect(reportClientError).toHaveBeenCalledOnce();
  });
});
