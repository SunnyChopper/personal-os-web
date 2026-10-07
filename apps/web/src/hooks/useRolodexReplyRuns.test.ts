import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('useRolodexReplyRuns mutation key', () => {
  it('exposes stable start mutation key for telemetry', () => {
    expect(queryKeys.personalBranding.replyRuns.start()).toEqual([
      'personal-branding',
      'reply-runs',
      'start',
    ]);
  });
});
