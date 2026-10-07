import { describe, expect, it } from 'vitest';
import { layoutTemplateForContentType } from '@/pages/admin/personal-branding/content-workbench/content-workbench-templates';
import { parseTemplateBodyStructure } from './parse-template-body-structure';

describe('parseTemplateBodyStructure', () => {
  it('parses numbered thread scaffold (1/, 2/)', () => {
    const body = layoutTemplateForContentType('SOCIAL_THREAD');
    const result = parseTemplateBodyStructure(body);
    expect(result?.kind).toBe('thread');
    expect(result?.segments).toHaveLength(6);
    expect(result?.segments[0]).toEqual({
      label: 'Tweet 1',
      body: 'Hook — bold claim or question',
    });
    expect(result?.segments[1]?.label).toBe('Tweet 2');
  });

  it('parses TWEET N labels', () => {
    const body = `TWEET 1: [Hook — bold claim]

TWEET 2 — [Context]

TWEET 3
[Insight]`;
    const result = parseTemplateBodyStructure(body);
    expect(result?.kind).toBe('thread');
    expect(result?.segments).toHaveLength(3);
    expect(result?.segments[0]?.label).toBe('Tweet 1');
    expect(result?.segments[0]?.body).toContain('[Hook');
    expect(result?.segments[2]?.body).toBe('[Insight]');
  });

  it('parses markdown section headings', () => {
    const body = layoutTemplateForContentType('DEEP_DIVE_BLOG');
    const result = parseTemplateBodyStructure(body);
    expect(result?.kind).toBe('sections');
    expect(result?.segments.length).toBeGreaterThanOrEqual(2);
    expect(result?.segments[0]?.label).toBe('Title');
    expect(result?.segments.some((s) => s.label === 'Hook')).toBe(true);
  });

  it('parses video beat brackets', () => {
    const body = layoutTemplateForContentType('VIDEO_SCRIPT');
    const result = parseTemplateBodyStructure(body);
    expect(result?.kind).toBe('beats');
    expect(result?.segments).toHaveLength(4);
    expect(result?.segments[0]?.label).toBe('INTRO — 0:00-0:15');
    expect(result?.segments[0]?.body).toContain('pattern interrupt');
  });

  it('returns null for single segment', () => {
    expect(parseTemplateBodyStructure('# Only one section\n\nBody text')).toBeNull();
    expect(parseTemplateBodyStructure('1/ Only one tweet')).toBeNull();
  });

  it('returns null for empty or whitespace', () => {
    expect(parseTemplateBodyStructure('')).toBeNull();
    expect(parseTemplateBodyStructure('   \n  ')).toBeNull();
  });

  it('returns null for unstructured plain text', () => {
    expect(
      parseTemplateBodyStructure('Just a paragraph with no recognizable structure markers.')
    ).toBeNull();
  });

  it('prefers thread over sections when both could match', () => {
    const body = `1/ First tweet

2/ Second tweet`;
    const result = parseTemplateBodyStructure(body);
    expect(result?.kind).toBe('thread');
  });
});
