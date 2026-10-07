import { describe, expect, it } from 'vitest';
import {
  countPreviewChars,
  getPlatformCharacterLimit,
  getPlatformPreviewSkin,
  isOverCharacterLimit,
  listPlatformPreviewSkinPlatforms,
} from './platform-preview-skins';
import type { BrandPlatform } from '@/types/api/personal-branding.dto';

const ALL_PLATFORMS: BrandPlatform[] = [
  'linkedin',
  'x',
  'medium',
  'youtube',
  'instagram',
  'newsletter',
];

describe('platform-preview-skins', () => {
  it('covers every BrandPlatform with skin config', () => {
    expect(listPlatformPreviewSkinPlatforms().sort()).toEqual([...ALL_PLATFORMS].sort());
    for (const platform of ALL_PLATFORMS) {
      const skin = getPlatformPreviewSkin(platform);
      expect(skin.maxWidthClass).toBeTruthy();
      expect(skin.frameClassName).toBeTruthy();
      expect(skin.proseClassName).toBeTruthy();
      expect(skin.linkHint).toBeTruthy();
    }
  });

  it('countPreviewChars uses raw markdown length', () => {
    const body = '# Title\n\nHello **world**';
    expect(countPreviewChars(body)).toBe(body.length);
  });

  it('reads character limits from bundled catalog defaults', () => {
    expect(getPlatformCharacterLimit('x')).toBe(280);
    expect(getPlatformCharacterLimit('linkedin')).toBe(1300);
    expect(getPlatformCharacterLimit('medium')).toBe(2500);
  });

  it('isOverCharacterLimit compares count to platform default', () => {
    expect(isOverCharacterLimit('x', 'a'.repeat(280))).toBe(false);
    expect(isOverCharacterLimit('x', 'a'.repeat(281))).toBe(true);
  });
});
