import { describe, expect, it } from 'vitest';
import {
  buildHandles,
  buildProfileUrl,
  computeDefaultNextFollowUpDate,
  followUpSortKey,
  getProfileDisplay,
  isFollowUpOverdue,
  parseConnectionProfile,
  priorityBadgeClassName,
  resolveRelationshipPriority,
} from './rolodex-platform';

describe('rolodex-platform', () => {
  it('builds profile URLs from platform and handle', () => {
    expect(buildProfileUrl('x', '@ada')).toBe('https://x.com/ada');
    expect(buildProfileUrl('linkedin', 'jane-doe')).toBe('https://linkedin.com/in/jane-doe');
    expect(buildProfileUrl('youtube', 'creator')).toBe('https://youtube.com/@creator');
    expect(buildProfileUrl('custom', 'https://blog.example.com')).toBe('https://blog.example.com');
  });

  it('builds handles map for standard platforms', () => {
    expect(buildHandles('x', 'ada')).toEqual({ x: '@ada' });
    expect(buildHandles('newsletter', 'https://news.example.com')).toEqual({
      newsletter: 'https://news.example.com',
    });
    expect(buildHandles('custom', 'https://blog.example.com')).toEqual({});
  });

  it('parses connection profile from handles', () => {
    expect(
      parseConnectionProfile({
        targetProfileUrl: 'https://x.com/ada',
        handles: { x: '@ada' },
      })
    ).toEqual({ platformId: 'x', handleOrUrl: 'ada' });
  });

  it('parses connection profile from target URL when handles missing', () => {
    expect(
      parseConnectionProfile({
        targetProfileUrl: 'https://www.linkedin.com/in/jane-doe/',
      })
    ).toEqual({ platformId: 'linkedin', handleOrUrl: 'jane-doe' });

    expect(
      parseConnectionProfile({
        targetProfileUrl: 'https://twitter.com/ada',
      })
    ).toEqual({ platformId: 'x', handleOrUrl: 'ada' });
  });

  it('formats profile display labels', () => {
    expect(
      getProfileDisplay({
        id: '1',
        name: 'Ada',
        targetProfileUrl: 'https://x.com/ada',
        handles: { x: '@ada' },
        conversationAngles: [],
        tags: [],
        userId: 'u',
        createdAt: '',
        updatedAt: '',
      }).label
    ).toBe('@ada');
  });

  it('resolves relationship priority from legacy tier', () => {
    expect(resolveRelationshipPriority({ tier: 'A', relationshipPriority: null })).toBe(
      'strategic'
    );
    expect(resolveRelationshipPriority({ tier: null, relationshipPriority: 'active' })).toBe(
      'active'
    );
  });

  it('applies priority badge classes', () => {
    expect(priorityBadgeClassName('strategic')).toContain('blue');
    expect(priorityBadgeClassName('watch')).toContain('gray');
  });

  it('sorts follow-up keys with earlier nextFollowUpAt first', () => {
    const soon = {
      id: '1',
      name: 'Soon',
      handles: {},
      conversationAngles: [],
      tags: [],
      userId: 'u',
      createdAt: '',
      updatedAt: '',
      nextFollowUpAt: '2026-06-10T00:00:00Z',
      lastInteractedAt: '2026-01-01T00:00:00Z',
    };
    const later = {
      id: '2',
      name: 'Later',
      handles: {},
      conversationAngles: [],
      tags: [],
      userId: 'u',
      createdAt: '',
      updatedAt: '',
      nextFollowUpAt: '2026-12-01T00:00:00Z',
      lastInteractedAt: '2020-01-01T00:00:00Z',
    };
    expect(followUpSortKey(soon)).toBeLessThan(followUpSortKey(later));
  });

  it('detects overdue follow-ups', () => {
    expect(isFollowUpOverdue('2020-01-01T00:00:00Z', new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(isFollowUpOverdue('2030-01-01T00:00:00Z', new Date('2026-01-01T00:00:00Z'))).toBe(false);
    expect(isFollowUpOverdue(null)).toBe(false);
  });

  it('computes default next follow-up from cadence', () => {
    expect(computeDefaultNextFollowUpDate(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
