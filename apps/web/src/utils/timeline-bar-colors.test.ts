import { describe, expect, it } from 'vitest';
import { getProjectTimelineBarColorClasses } from './timeline-bar-colors';

describe('getProjectTimelineBarColorClasses', () => {
  it('uses stale styling when isStale is true', () => {
    const classes = getProjectTimelineBarColorClasses('Planning', { isStale: true });
    expect(classes).toContain('rose');
    expect(classes).toContain('border-dashed');
  });

  it('uses planning styling when not stale', () => {
    const classes = getProjectTimelineBarColorClasses('Planning');
    expect(classes).toContain('purple');
    expect(classes).not.toContain('border-dashed');
  });

  it('prefers stale styling over on-hold status', () => {
    const classes = getProjectTimelineBarColorClasses('On Hold', { isStale: true });
    expect(classes).toContain('rose');
    expect(classes).not.toContain('yellow');
  });
});
