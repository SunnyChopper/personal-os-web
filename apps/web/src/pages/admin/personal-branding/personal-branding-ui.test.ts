import { describe, expect, it } from 'vitest';
import {
  contentStatusPillTone,
  contentTypePillClassName,
  linkAccentClassName,
  pbCompactControlDensityClassName,
  pbFeedbackTextClassName,
  pbFocusVisibleRingClassName,
  pbQuietControlClassName,
  selectableChipClassName,
  selectableFilterChipClassName,
  statusPillClassName,
} from './personal-branding-ui';

describe('personal-branding-ui focus tokens', () => {
  it('pbFocusVisibleRingClassName uses focus-visible blue/40 ring', () => {
    expect(pbFocusVisibleRingClassName).toContain('focus-visible:ring-2');
    expect(pbFocusVisibleRingClassName).toContain('focus-visible:ring-blue-500/40');
    expect(pbFocusVisibleRingClassName).not.toMatch(/\bfocus:ring-/);
  });

  it('pbQuietControlClassName composes quiet hover and focus-visible ring', () => {
    expect(pbQuietControlClassName).toContain('hover:bg-gray-100');
    expect(pbQuietControlClassName).toContain('focus-visible:ring-blue-500/40');
    expect(pbQuietControlClassName).not.toMatch(/\bfocus:ring-/);
  });

  it('pbCompactControlDensityClassName matches filter chip vertical density', () => {
    expect(pbCompactControlDensityClassName).toContain('min-h-8');
    expect(pbCompactControlDensityClassName).toContain('px-3');
    expect(pbCompactControlDensityClassName).toContain('py-1.5');
    expect(pbCompactControlDensityClassName).toContain('text-xs');
    expect(selectableFilterChipClassName(false)).toContain('px-3 py-1.5 text-xs');
  });

  it('selectableChipClassName and linkAccentClassName share the PB focus ring', () => {
    const chip = selectableChipClassName(false);
    expect(chip).toContain('focus-visible:ring-blue-500/40');
    expect(chip).not.toMatch(/\bfocus:ring-/);

    expect(linkAccentClassName).toContain('focus-visible:ring-blue-500/40');
    expect(linkAccentClassName).not.toMatch(/\bfocus:ring-/);
  });
});

describe('personal-branding-ui status pills', () => {
  it('contentStatusPillTone maps Published to success, Archived to neutral, and draft lifecycle to info', () => {
    expect(contentStatusPillTone('PUBLISHED')).toBe('success');
    expect(contentStatusPillTone('SKIPPED')).toBe('neutral');
    expect(contentStatusPillTone('DRAFT')).toBe('info');
    expect(contentStatusPillTone('FINALIZED')).toBe('info');
    expect(contentStatusPillTone('PIPELINED')).toBe('info');
  });

  it('contentTypePillClassName uses info tone', () => {
    expect(contentTypePillClassName()).toContain('bg-blue-100');
    expect(contentTypePillClassName('ml-1')).toContain('ml-1');
  });

  it('statusPillClassName success and info match Content Workbench draft/published hues', () => {
    expect(statusPillClassName('success')).toContain('bg-green-100');
    expect(statusPillClassName('info')).toContain('bg-blue-100');
    expect(statusPillClassName('warning')).toContain('bg-amber-100');
    expect(statusPillClassName('neutral')).toContain('bg-gray-100');
  });
});

describe('personal-branding-ui feedback text tokens', () => {
  it('pbFeedbackTextClassName maps semantic tones to dual-theme text classes', () => {
    expect(pbFeedbackTextClassName('info')).toContain('text-blue-700');
    expect(pbFeedbackTextClassName('info')).toContain('dark:text-blue-300');
    expect(pbFeedbackTextClassName('warning')).toContain('text-amber-700');
    expect(pbFeedbackTextClassName('warning')).toContain('dark:text-amber-300');
    expect(pbFeedbackTextClassName('danger')).toContain('text-red-600');
    expect(pbFeedbackTextClassName('danger')).toContain('dark:text-red-400');
    expect(pbFeedbackTextClassName('muted')).toContain('text-gray-600');
    expect(pbFeedbackTextClassName('muted')).toContain('dark:text-gray-400');
  });

  it('pbFeedbackTextClassName avoids indigo, violet, and sky accent hues', () => {
    for (const tone of ['info', 'warning', 'danger', 'muted'] as const) {
      const classes = pbFeedbackTextClassName(tone);
      expect(classes).not.toMatch(/indigo|violet|sky/);
    }
  });

  it('pbFeedbackTextClassName merges optional className', () => {
    expect(pbFeedbackTextClassName('info', 'shrink-0')).toContain('shrink-0');
  });
});
