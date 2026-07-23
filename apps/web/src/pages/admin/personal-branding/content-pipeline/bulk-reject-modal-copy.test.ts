import { describe, expect, it } from 'vitest';
import { getBulkRejectModalCopy } from './bulk-reject-modal-copy';

describe('getBulkRejectModalCopy', () => {
  it('uses single-variant copy for one variant', () => {
    expect(getBulkRejectModalCopy(1)).toEqual({
      title: 'Reject variant',
      description: 'What fell flat? This feeds future regeneration prompts.',
      submitLabel: 'Submit rejection',
    });
  });

  it('uses bulk copy for multiple variants', () => {
    expect(getBulkRejectModalCopy(3)).toEqual({
      title: 'Reject 3 variants',
      description:
        'Share one critique for all 3 selected variants. This feeds future regeneration prompts.',
      submitLabel: 'Reject all',
    });
  });
});
