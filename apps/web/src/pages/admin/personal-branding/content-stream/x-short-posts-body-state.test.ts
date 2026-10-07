import { describe, expect, it } from 'vitest';
import {
  resolveXShortPostsBodyState,
  resolveXShortPostsJobActive,
} from './x-short-posts-body-state';

describe('resolveXShortPostsBodyState', () => {
  it('returns generating when job is active regardless of post count', () => {
    expect(resolveXShortPostsBodyState({ postCount: 0, isJobActive: true })).toBe('generating');
    expect(resolveXShortPostsBodyState({ postCount: 4, isJobActive: true })).toBe('generating');
  });

  it('returns empty when idle with no posts', () => {
    expect(resolveXShortPostsBodyState({ postCount: 0, isJobActive: false })).toBe('empty');
  });

  it('returns list when idle with posts', () => {
    expect(resolveXShortPostsBodyState({ postCount: 2, isJobActive: false })).toBe('list');
  });
});

describe('resolveXShortPostsJobActive', () => {
  it('is active while submit, poll in-flight, or first fetch loading', () => {
    expect(resolveXShortPostsJobActive(true, null)).toBe(true);
    expect(resolveXShortPostsJobActive(false, 'job-1', 'running')).toBe(true);
    expect(resolveXShortPostsJobActive(false, 'job-1', undefined, true)).toBe(true);
  });

  it('is inactive when idle or terminal failed with job id retained for retry UI', () => {
    expect(resolveXShortPostsJobActive(false, null)).toBe(false);
    expect(resolveXShortPostsJobActive(false, 'job-1', 'failed')).toBe(false);
    expect(resolveXShortPostsJobActive(false, 'job-1', 'succeeded')).toBe(false);
  });
});
