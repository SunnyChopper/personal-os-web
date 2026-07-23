import { describe, expect, it } from 'vitest';
import {
  formatRhetoricalSelectionSummary,
  humanizeCatalogId,
  labelFromCatalog,
  parseRequirementLines,
} from '@/lib/personal-branding/platform-rule-display';
import type { PlatformRuleCatalogEntry } from '@/types/api/personal-branding.dto';

const sampleEntries: PlatformRuleCatalogEntry[] = [
  {
    id: 'descriptive',
    label: 'Descriptive',
    definition: 'Paint a picture.',
    enabledEffect: 'Use vivid detail.',
    disabledEffect: 'Stay abstract.',
  },
  {
    id: 'ruleOfThree',
    label: 'Rule of Three',
    definition: 'Triads.',
    enabledEffect: 'Use triplets.',
    disabledEffect: 'Avoid triads.',
  },
];

describe('parseRequirementLines', () => {
  it('returns empty array for blank input', () => {
    expect(parseRequirementLines(null)).toEqual([]);
    expect(parseRequirementLines('   ')).toEqual([]);
  });

  it('strips bullet prefixes and blank lines', () => {
    expect(
      parseRequirementLines('- Use the thread format\n\n• Avoid em-dashes\n* No hashtags')
    ).toEqual(['Use the thread format', 'Avoid em-dashes', 'No hashtags']);
  });

  it('preserves plain multiline text', () => {
    expect(parseRequirementLines('Line one\nLine two')).toEqual(['Line one', 'Line two']);
  });
});

describe('labelFromCatalog', () => {
  it('resolves catalog labels', () => {
    expect(labelFromCatalog(sampleEntries, 'descriptive')).toBe('Descriptive');
    expect(labelFromCatalog(sampleEntries, 'ruleOfThree')).toBe('Rule of Three');
  });

  it('falls back to humanized ids when catalog is missing', () => {
    expect(labelFromCatalog(undefined, 'rhetoricalQuestion')).toBe('Rhetorical Question');
  });
});

describe('humanizeCatalogId', () => {
  it('splits camelCase identifiers', () => {
    expect(humanizeCatalogId('ruleOfThree')).toBe('Rule Of Three');
    expect(humanizeCatalogId('rhetoricalQuestion')).toBe('Rhetorical Question');
  });
});

describe('formatRhetoricalSelectionSummary', () => {
  it('returns none selected when empty', () => {
    expect(formatRhetoricalSelectionSummary([], sampleEntries)).toBe('None selected');
  });

  it('joins labels for a small selection', () => {
    expect(formatRhetoricalSelectionSummary(['descriptive'], sampleEntries)).toBe('Descriptive');
  });

  it('truncates with +N when more than max labels', () => {
    expect(
      formatRhetoricalSelectionSummary(['descriptive', 'ruleOfThree', 'missing'], sampleEntries, 2)
    ).toBe('Descriptive · Rule of Three +1');
  });
});
