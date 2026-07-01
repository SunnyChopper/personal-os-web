import { describe, expect, it } from 'vitest';
import { layoutTemplateForContentType } from './content-workbench-templates';

describe('layoutTemplateForContentType', () => {
  it('returns blog scaffold', () => {
    const tpl = layoutTemplateForContentType('DEEP_DIVE_BLOG');
    expect(tpl).toContain('## Hook');
  });

  it('returns video script scaffold', () => {
    const tpl = layoutTemplateForContentType('VIDEO_SCRIPT');
    expect(tpl).toContain('[INTRO');
  });
});
