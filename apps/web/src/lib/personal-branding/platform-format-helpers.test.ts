import { describe, expect, it } from 'vitest';
import {
  buildOutputTestGenerateInput,
  contentTypeForPlatformFormat,
  defaultPlatformFormat,
  defaultReplyPlatformFormat,
} from '@/lib/personal-branding/platform-format-helpers';

describe('platform-format-helpers', () => {
  it('defaults reply X format to single_post (not Live Output thread)', () => {
    expect(defaultReplyPlatformFormat('x')).toBe('single_post');
    expect(defaultPlatformFormat('x')).toBe('thread');
  });
  it('maps instagram carousel to SOCIAL_THREAD', () => {
    expect(contentTypeForPlatformFormat('carousel')).toBe('SOCIAL_THREAD');
    expect(defaultPlatformFormat('instagram')).toBe('carousel');
  });

  it('builds generate input with platformFormat and derived contentType', () => {
    const input = buildOutputTestGenerateInput({
      topic: 'Test topic',
      platform: 'instagram',
      platformFormat: 'reel',
    });
    expect(input.platformFormat).toBe('reel');
    expect(input.contentType).toBe('VIDEO_SCRIPT');
    expect(input.platform).toBe('instagram');
  });
});
