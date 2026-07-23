import { describe, expect, it } from 'vitest';
import {
  contentStatusBadgeLabel,
  originallyPublishedOnLabel,
  pipelineSourceOptionLabel,
} from './content-node-labels';

describe('contentStatusBadgeLabel', () => {
  it('returns Draft for non-published statuses', () => {
    expect(contentStatusBadgeLabel('DRAFT')).toBe('Draft');
    expect(contentStatusBadgeLabel('FINALIZED')).toBe('Draft');
    expect(contentStatusBadgeLabel('PIPELINED')).toBe('Draft');
    expect(contentStatusBadgeLabel('SKIPPED')).toBe('Draft');
  });

  it('returns Published when status is PUBLISHED without platform', () => {
    expect(contentStatusBadgeLabel('PUBLISHED')).toBe('Published');
    expect(contentStatusBadgeLabel('PUBLISHED', null)).toBe('Published');
    expect(contentStatusBadgeLabel('PUBLISHED', undefined)).toBe('Published');
  });

  it('returns Published · {Platform} when status is PUBLISHED with platform', () => {
    expect(contentStatusBadgeLabel('PUBLISHED', 'linkedin')).toBe('Published · LinkedIn');
    expect(contentStatusBadgeLabel('PUBLISHED', 'medium')).toBe('Published · Medium');
    expect(contentStatusBadgeLabel('PUBLISHED', 'x')).toBe('Published · X (Twitter)');
  });
});

describe('pipelineSourceOptionLabel', () => {
  it('returns title only when no platform and not pipelined', () => {
    expect(pipelineSourceOptionLabel({ title: 'My post', status: 'PUBLISHED' })).toBe('My post');
  });

  it('returns title · Platform when platform is set', () => {
    expect(
      pipelineSourceOptionLabel({
        title: 'My post',
        status: 'PUBLISHED',
        platform: 'linkedin',
      })
    ).toBe('My post · LinkedIn');
  });

  it('appends · Pipelined when status is PIPELINED', () => {
    expect(pipelineSourceOptionLabel({ title: 'My post', status: 'PIPELINED' })).toBe(
      'My post · Pipelined'
    );
  });

  it('includes platform and Pipelined suffix when both apply', () => {
    expect(
      pipelineSourceOptionLabel({
        title: 'My post',
        status: 'PIPELINED',
        platform: 'medium',
      })
    ).toBe('My post · Medium · Pipelined');
  });
});

describe('originallyPublishedOnLabel', () => {
  it('returns platform-specific label when platform is set', () => {
    expect(originallyPublishedOnLabel('linkedin')).toBe('Originally published on LinkedIn');
  });

  it('returns unknown platform fallback when platform is missing', () => {
    expect(originallyPublishedOnLabel(null)).toBe('Originally published on Unknown platform');
    expect(originallyPublishedOnLabel(undefined)).toBe('Originally published on Unknown platform');
  });
});
