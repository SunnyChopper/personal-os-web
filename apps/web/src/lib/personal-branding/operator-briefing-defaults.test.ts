import { describe, expect, it } from 'vitest';
import { defaultIncludeOperatorBriefing } from './operator-briefing-defaults';

describe('defaultIncludeOperatorBriefing', () => {
  it('defaults on for high and max learning cost', () => {
    expect(defaultIncludeOperatorBriefing('high')).toBe(true);
    expect(defaultIncludeOperatorBriefing('max')).toBe(true);
  });

  it('defaults off for low, medium, and absent', () => {
    expect(defaultIncludeOperatorBriefing('low')).toBe(false);
    expect(defaultIncludeOperatorBriefing('medium')).toBe(false);
    expect(defaultIncludeOperatorBriefing(null)).toBe(false);
  });
});
