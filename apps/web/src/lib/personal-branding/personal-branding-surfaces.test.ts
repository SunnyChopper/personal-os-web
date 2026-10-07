import { describe, expect, it } from 'vitest';
import {
  IDEA_CARD_SUMMARY_LINES,
  IDEA_CARD_TITLE_LINES,
  IDEA_CARD_WHY_CREATE_LINES,
  pbAssetPanelMaxHeightClassName,
  pbDraftTitleInputClassName,
  pbLineClamp2ExpandableClassName,
  pbLineClamp3ExpandableClassName,
  pbSidebarDrawerMaxWidthClassName,
  pbSidebarMaxWidthClassName,
  pbSidebarMobileMaxHeightClassName,
  pbSidebarTwoColumnColsClassName,
  pbSidebarWidthPx,
} from './personal-branding-surfaces';

describe('personal-branding layout dimension tokens', () => {
  it('documents sidebar width in pixels', () => {
    expect(pbSidebarWidthPx).toBe(280);
  });

  it('defines shared sidebar two-column grid', () => {
    expect(pbSidebarTwoColumnColsClassName).toContain('280px');
    expect(pbSidebarTwoColumnColsClassName).toContain('lg:grid-cols-[280px_1fr]');
  });

  it('defines sidebar max-width tokens for panel and drawer', () => {
    expect(pbSidebarMaxWidthClassName).toContain('max-w-[280px]');
    expect(pbSidebarDrawerMaxWidthClassName).toContain('!max-w-[280px]');
  });

  it('defines mobile sidebar max-height', () => {
    expect(pbSidebarMobileMaxHeightClassName).toContain('35vh');
    expect(pbSidebarMobileMaxHeightClassName).toContain('lg:max-h-none');
  });

  it('defines asset panel max-height', () => {
    expect(pbAssetPanelMaxHeightClassName).toContain('28vh');
  });

  it('defines a readable draft title input', () => {
    expect(pbDraftTitleInputClassName).toContain('text-lg');
    expect(pbDraftTitleInputClassName).toContain('text-gray-900');
    expect(pbDraftTitleInputClassName).toContain('dark:text-white');
    expect(pbDraftTitleInputClassName).toContain('focus:ring');
  });

  it('defines expandable line-clamp tokens', () => {
    expect(pbLineClamp2ExpandableClassName).toContain('line-clamp-2');
    expect(pbLineClamp2ExpandableClassName).toContain('group-hover:line-clamp-none');
    expect(pbLineClamp3ExpandableClassName).toContain('line-clamp-3');
    expect(pbLineClamp3ExpandableClassName).toContain('group-hover:line-clamp-none');
  });

  it('defines Content Workbench idea card field line limits', () => {
    expect(IDEA_CARD_TITLE_LINES).toBe(2);
    expect(IDEA_CARD_SUMMARY_LINES).toBe(3);
    expect(IDEA_CARD_WHY_CREATE_LINES).toBe(3);
  });
});
