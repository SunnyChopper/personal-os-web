import { describe, expect, it } from 'vitest';
import { draftFromSuggestedParams } from '@/lib/personal-branding/reply-generation-draft';

describe('draftFromSuggestedParams', () => {
  it('defaults X reply format to single_post', () => {
    const draft = draftFromSuggestedParams(null, 'model-1', 'profile-1', 'x');
    expect(draft.platformFormat).toBe('single_post');
  });

  it('defaults LinkedIn reply format to single_post', () => {
    const draft = draftFromSuggestedParams(null, 'model-1', 'profile-1', 'linkedin');
    expect(draft.platformFormat).toBe('single_post');
  });

  it('defaults questionFirstBias to auto', () => {
    const draft = draftFromSuggestedParams(null, 'model-1', 'profile-1', 'x');
    expect(draft.questionFirstBias).toBe('auto');
  });
});
