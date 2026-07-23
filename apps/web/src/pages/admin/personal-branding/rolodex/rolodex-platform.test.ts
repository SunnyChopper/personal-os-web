import { describe, expect, it } from 'vitest';
import {
  buildHandles,
  buildProfileUrl,
  computeDefaultNextFollowUpDate,
  daysSinceLastTouch,
  endOfLocalWeek,
  followUpSortKey,
  formatLastReconAgeLabel,
  formatLastReconRelativeLabel,
  getProfileDisplay,
  isDueThisWeek,
  isFollowUpOverdue,
  isStaleRecon,
  lastReconSortKey,
  matchesInteractionsBoardFilters,
  parseConnectionProfile,
  priorityBadgeClassName,
  resolveRelationshipPriority,
  suggestedCadenceDaysForPriority,
  stalenessBadgeTone,
  startOfLocalWeek,
  STALE_RECON_DAYS,
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

  it('suggests follow-up cadence days from relationship priority', () => {
    expect(suggestedCadenceDaysForPriority('strategic')).toBe(7);
    expect(suggestedCadenceDaysForPriority('active')).toBe(14);
    expect(suggestedCadenceDaysForPriority('nurture')).toBe(30);
    expect(suggestedCadenceDaysForPriority('watch')).toBe(90);
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

  it('computes local week boundaries (Mon–Sun)', () => {
    const thursday = new Date(2026, 6, 16);
    expect(startOfLocalWeek(thursday)).toBe('2026-07-13');
    expect(endOfLocalWeek(thursday)).toBe('2026-07-19');
  });

  it('computes days since last touch', () => {
    const now = new Date('2026-07-16T12:00:00Z');
    expect(daysSinceLastTouch(null, now)).toBeNull();
    expect(daysSinceLastTouch('2026-07-14T00:00:00Z', now)).toBe(2);
  });

  it('detects due this week including overdue', () => {
    const now = new Date(2026, 6, 16);
    expect(isDueThisWeek('2026-07-10T00:00:00Z', now)).toBe(true);
    expect(isDueThisWeek('2026-07-18T00:00:00Z', now)).toBe(true);
    expect(isDueThisWeek('2026-07-25T00:00:00Z', now)).toBe(false);
    expect(isDueThisWeek(null, now)).toBe(false);
  });

  it('matches interactions board filters with priority OR and special AND', () => {
    const strategic = {
      relationshipPriority: 'strategic' as const,
      tier: null,
      nextFollowUpAt: '2026-07-18T00:00:00Z',
      lastInteractedAt: '2026-06-01T00:00:00Z',
      lastReconPostedAt: '2026-07-18T00:00:00Z',
    };
    const watchNever = {
      relationshipPriority: 'watch' as const,
      tier: null,
      nextFollowUpAt: null,
      lastInteractedAt: null,
      lastReconPostedAt: null,
    };
    const legacyActive = {
      relationshipPriority: null,
      tier: 'B',
      nextFollowUpAt: '2026-07-18T00:00:00Z',
      lastInteractedAt: '2026-06-01T00:00:00Z',
      lastReconPostedAt: '2026-06-01T00:00:00Z',
    };
    const staleRecon = {
      relationshipPriority: 'strategic' as const,
      tier: null,
      nextFollowUpAt: '2026-07-18T00:00:00Z',
      lastInteractedAt: '2026-06-01T00:00:00Z',
      lastReconPostedAt: '2026-06-01T00:00:00Z',
    };
    const now = new Date(2026, 6, 16);

    expect(
      matchesInteractionsBoardFilters(
        strategic,
        {
          priorities: ['strategic'],
          dueThisWeek: false,
          neverInteracted: false,
          staleRecon: false,
        },
        now
      )
    ).toBe(true);
    expect(
      matchesInteractionsBoardFilters(
        strategic,
        { priorities: ['watch'], dueThisWeek: false, neverInteracted: false, staleRecon: false },
        now
      )
    ).toBe(false);
    expect(
      matchesInteractionsBoardFilters(
        strategic,
        { priorities: [], dueThisWeek: true, neverInteracted: false, staleRecon: false },
        now
      )
    ).toBe(true);
    expect(
      matchesInteractionsBoardFilters(
        watchNever,
        { priorities: [], dueThisWeek: false, neverInteracted: true, staleRecon: false },
        now
      )
    ).toBe(true);
    expect(
      matchesInteractionsBoardFilters(
        legacyActive,
        { priorities: ['active'], dueThisWeek: false, neverInteracted: false, staleRecon: false },
        now
      )
    ).toBe(true);
    expect(
      matchesInteractionsBoardFilters(
        strategic,
        { priorities: ['strategic'], dueThisWeek: true, neverInteracted: true, staleRecon: false },
        now
      )
    ).toBe(false);
    expect(
      matchesInteractionsBoardFilters(
        staleRecon,
        { priorities: ['strategic'], dueThisWeek: false, neverInteracted: false, staleRecon: true },
        now
      )
    ).toBe(true);
    expect(
      matchesInteractionsBoardFilters(
        strategic,
        { priorities: ['strategic'], dueThisWeek: false, neverInteracted: false, staleRecon: true },
        now
      )
    ).toBe(false);
  });

  it('picks staleness badge tone from cadence or default threshold', () => {
    expect(stalenessBadgeTone(null)).toBe('muted');
    expect(stalenessBadgeTone(10, 30)).toBe('muted');
    expect(stalenessBadgeTone(30, 30)).toBe('warning');
    expect(stalenessBadgeTone(45)).toBe('warning');
  });

  it('formats last recon age labels', () => {
    const now = new Date('2026-07-19T12:00:00Z');
    expect(formatLastReconAgeLabel(null, now)).toEqual({
      label: '—',
      title: 'No recon posts yet',
    });
    expect(formatLastReconAgeLabel('2026-07-19T08:00:00Z', now)).toEqual({
      label: 'Today',
      title: new Date('2026-07-19T08:00:00Z').toLocaleDateString(),
    });
    expect(formatLastReconAgeLabel('2026-07-10T08:00:00Z', now)).toEqual({
      label: '9d',
      title: new Date('2026-07-10T08:00:00Z').toLocaleDateString(),
    });
  });

  it('formats last recon relative labels for board cards', () => {
    const now = new Date('2026-07-19T12:00:00Z');
    expect(formatLastReconRelativeLabel(null, now)).toEqual({
      label: 'Recon —',
      title: 'No recon posts yet',
    });
    expect(formatLastReconRelativeLabel('2026-07-19T11:59:30Z', now)).toEqual({
      label: 'Recon just now',
      title: new Date('2026-07-19T11:59:30Z').toLocaleDateString(),
    });
    expect(formatLastReconRelativeLabel('2026-07-19T11:55:00Z', now)).toEqual({
      label: 'Recon 5m ago',
      title: new Date('2026-07-19T11:55:00Z').toLocaleDateString(),
    });
    expect(formatLastReconRelativeLabel('2026-07-19T10:00:00Z', now)).toEqual({
      label: 'Recon 2h ago',
      title: new Date('2026-07-19T10:00:00Z').toLocaleDateString(),
    });
    expect(formatLastReconRelativeLabel('2026-07-16T12:00:00Z', now)).toEqual({
      label: 'Recon 3d ago',
      title: new Date('2026-07-16T12:00:00Z').toLocaleDateString(),
    });
  });

  it('detects stale recon at threshold', () => {
    const now = new Date('2026-07-19T12:00:00Z');
    expect(STALE_RECON_DAYS).toBe(7);
    expect(isStaleRecon(null, now)).toBe(true);
    expect(isStaleRecon('2026-07-18T12:00:00Z', now)).toBe(false);
    expect(isStaleRecon('2026-07-10T12:00:00Z', now)).toBe(true);
  });

  it('sorts last recon keys with older posts first and nulls last', () => {
    const base = {
      name: 'Conn',
      handles: {},
      conversationAngles: [],
      tags: [],
      userId: 'u',
      createdAt: '',
      updatedAt: '',
    };
    const older = {
      ...base,
      id: '1',
      lastReconPostedAt: '2026-06-01T00:00:00Z',
    };
    const newer = {
      ...base,
      id: '2',
      lastReconPostedAt: '2026-07-01T00:00:00Z',
    };
    const never = {
      ...base,
      id: '3',
      lastReconPostedAt: null,
    };
    expect(lastReconSortKey(older)).toBeLessThan(lastReconSortKey(newer));
    expect(lastReconSortKey(newer)).toBeLessThan(lastReconSortKey(never));
  });
});
