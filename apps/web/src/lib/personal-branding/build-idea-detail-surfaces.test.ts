import { describe, expect, it } from 'vitest';
import { buildIdeaDetailPageClassName } from './build-idea-detail-surfaces';

describe('build-idea-detail-surfaces', () => {
  it('fills the page shell instead of nesting a reading column', () => {
    expect(buildIdeaDetailPageClassName).toContain('w-full');
    expect(buildIdeaDetailPageClassName).not.toContain('max-w-');
    expect(buildIdeaDetailPageClassName).not.toContain('mx-auto');
  });
});
