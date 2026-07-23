import { describe, expect, it } from 'vitest';
import {
  buildSourceContentSelectOptions,
  formatSourceContentSelectOption,
  shortSlugFromTitle,
} from './source-content-select-label';

describe('shortSlugFromTitle', () => {
  it('kebab-cases and lowercases titles', () => {
    expect(shortSlugFromTitle('How Transformer Architecture Works')).toBe(
      'how-transformer-architecture'
    );
  });

  it('truncates long slugs at word boundaries when possible', () => {
    const slug = shortSlugFromTitle(
      'A Very Long Title That Should Be Truncated To A Reasonable Length For Display'
    );
    expect(slug.length).toBeLessThanOrEqual(28);
    expect(slug).not.toMatch(/-$/);
  });

  it('returns empty string for punctuation-only titles', () => {
    expect(shortSlugFromTitle('!!!')).toBe('');
  });
});

describe('formatSourceContentSelectOption', () => {
  const baseNode = {
    id: 'content-abc12345',
    title: 'How Transformer Architecture Works',
    status: 'PUBLISHED' as const,
    platform: 'medium' as const,
    createdAt: '2026-07-15T12:00:00.000Z',
  };

  it('uses title as label and platform · date · slug as description', () => {
    const option = formatSourceContentSelectOption(baseNode);
    expect(option.value).toBe('content-abc12345');
    expect(option.label).toBe('How Transformer Architecture Works');
    expect(option.description).toBe('Medium · 2026-07-15 · how-transformer-architecture');
  });

  it('uses Unknown platform when platform is missing', () => {
    const option = formatSourceContentSelectOption({
      ...baseNode,
      platform: null,
    });
    expect(option.description).toContain('Unknown platform');
  });

  it('appends Pipelined when status is PIPELINED', () => {
    const option = formatSourceContentSelectOption({
      ...baseNode,
      status: 'PIPELINED',
    });
    expect(option.description).toContain('· Pipelined');
  });

  it('appends id suffix when disambiguateIds contains the node id', () => {
    const option = formatSourceContentSelectOption(baseNode, {
      disambiguateIds: new Set(['content-abc12345']),
    });
    expect(option.description).toContain('· 2345');
  });
});

describe('buildSourceContentSelectOptions', () => {
  it('disambiguates near-duplicate nodes with id suffix', () => {
    const nodes = [
      {
        id: 'content-aaaa1111',
        title: 'How Transformer Architecture Works',
        status: 'PUBLISHED' as const,
        platform: 'medium' as const,
        createdAt: '2026-07-15T12:00:00.000Z',
      },
      {
        id: 'content-bbbb2222',
        title: 'How Transformer Architecture Works!',
        status: 'PUBLISHED' as const,
        platform: 'medium' as const,
        createdAt: '2026-07-15T12:00:00.000Z',
      },
    ];

    const options = buildSourceContentSelectOptions(nodes);
    expect(options).toHaveLength(2);
    expect(options[0]?.description).toContain('· 1111');
    expect(options[1]?.description).toContain('· 2222');
  });
});
