import { describe, expect, it } from 'vitest';
import {
  aggregateProfileStrengthSummary,
  hasResolvedPlatformPolicy,
  normalizeToneMetrics,
  resolvePlatformRuleSource,
  summarizeProfileStrength,
} from './profile-strength';

describe('normalizeToneMetrics', () => {
  it('keeps numeric entries only', () => {
    expect(
      normalizeToneMetrics({ clarity: 0.8, warmth: 'high', authority: 0.5, humor: null })
    ).toEqual({ clarity: 0.8, authority: 0.5 });
  });
});

describe('resolvePlatformRuleSource', () => {
  it('returns none when no rules contribute', () => {
    expect(resolvePlatformRuleSource([])).toBe('none');
  });

  it('returns universalOnly when every rule is universal', () => {
    expect(resolvePlatformRuleSource([{ isUniversal: true }, { isUniversal: true }])).toBe(
      'universalOnly'
    );
  });

  it('returns profileOverlay when at least one rule is profile-linked', () => {
    expect(resolvePlatformRuleSource([{ isUniversal: true }, { isUniversal: false }])).toBe(
      'profileOverlay'
    );
  });
});

describe('summarizeProfileStrength', () => {
  const platformLabels = {
    linkedin: 'LinkedIn',
    x: 'X',
    medium: 'Medium',
    youtube: 'YouTube',
    instagram: 'Instagram',
    newsletter: 'Newsletter',
  };

  it('returns empty label when nothing is configured', () => {
    expect(
      summarizeProfileStrength({
        toneMetrics: {},
        bannedPhrases: [],
        platformLabels,
      })
    ).toEqual({
      label: 'No constraints yet',
      toneCount: 0,
      bannedCount: 0,
      platformCount: 0,
      isEmpty: true,
    });
  });

  it('builds compact badge text from counts', () => {
    expect(
      summarizeProfileStrength({
        toneMetrics: { clarity: 0.8, warmth: 0.6 },
        bannedPhrases: ['synergy', 'leverage'],
        profileOverlayPlatforms: ['linkedin', 'x'],
        platformLabels,
      })
    ).toEqual({
      label: '2 tone metrics · 2 banned phrases · rules active',
      toneCount: 2,
      bannedCount: 2,
      platformCount: 2,
      isEmpty: false,
    });
  });

  it('labels universal-only platforms separately from profile overlay', () => {
    expect(
      summarizeProfileStrength({
        toneMetrics: { clarity: 0.5 },
        bannedPhrases: [],
        universalOnlyPlatforms: ['linkedin'],
        profileOverlayPlatforms: ['x'],
        platformLabels,
      }).label
    ).toBe('1 tone metric · universal fallback · rules active');
  });

  it('omits platform names from collapsed copy when many platforms have overlay rules', () => {
    expect(
      summarizeProfileStrength({
        toneMetrics: { clarity: 0.5 },
        bannedPhrases: [],
        profileOverlayPlatforms: ['linkedin', 'x', 'medium'],
        platformLabels,
      }).label
    ).toBe('1 tone metric · rules active');
  });
});

describe('aggregateProfileStrengthSummary', () => {
  it('dedupes identical profiles and shows a single tone line', () => {
    expect(
      aggregateProfileStrengthSummary({
        profiles: [
          {
            toneMetrics: { clarity: 0.8, warmth: 0.6 },
            bannedPhrases: ['synergy', 'leverage'],
          },
        ],
        profileOverlayPlatforms: ['linkedin', 'x'],
      }).label
    ).toBe('2 tone metrics · 2 banned phrases · rules active');
  });

  it('shows a range when unique profiles have different tone counts', () => {
    expect(
      aggregateProfileStrengthSummary({
        profiles: [
          { toneMetrics: { clarity: 0.8, warmth: 0.6 }, bannedPhrases: [] },
          {
            toneMetrics: { clarity: 0.8, warmth: 0.6, authority: 0.5, humor: 0.2 },
            bannedPhrases: [],
          },
        ],
        profileOverlayPlatforms: ['x'],
      }).label
    ).toBe('2–4 tone metrics · rules active');
  });
});

describe('hasResolvedPlatformPolicy', () => {
  it('detects meaningful resolved policy fields', () => {
    expect(
      hasResolvedPlatformPolicy({
        characterLimit: null,
        readTimeLimitMinutes: null,
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: '  ',
      })
    ).toBe(false);

    expect(
      hasResolvedPlatformPolicy({
        characterLimit: 280,
        readTimeLimitMinutes: null,
        rhetoricalModes: [],
        rhetoricalDevices: [],
        requirements: '',
      })
    ).toBe(true);
  });
});
