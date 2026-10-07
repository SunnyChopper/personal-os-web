import { describe, expect, it } from 'vitest';
import {
  resumeBuilderFormGridClassName,
  resumeBuilderFormGridWideClassName,
  resumeBuilderItemCardClassName,
  resumeBuilderProfileSplitClassName,
  resumeBuilderSectionClassName,
  resumeBuilderTabClassName,
} from './career-resume-surfaces';

describe('career-resume-surfaces', () => {
  it('keeps section shells dual-theme and unconstrained', () => {
    expect(resumeBuilderSectionClassName).toContain('bg-white');
    expect(resumeBuilderSectionClassName).toContain('dark:bg-gray-800');
    expect(resumeBuilderSectionClassName).not.toContain('max-w-3xl');
  });

  it('splits profile and education only at 2xl', () => {
    expect(resumeBuilderProfileSplitClassName).toContain('2xl:grid-cols-12');
    expect(resumeBuilderProfileSplitClassName).toContain('grid-cols-1');
  });

  it('uses a two-column form grid by default and three columns when wide', () => {
    expect(resumeBuilderFormGridClassName).toContain('md:grid-cols-2');
    expect(resumeBuilderFormGridClassName).not.toContain('xl:grid-cols-3');
    expect(resumeBuilderFormGridWideClassName).toContain('xl:grid-cols-3');
  });

  it('pairs item-card hover chrome for light and dark', () => {
    expect(resumeBuilderItemCardClassName).toContain('hover:border-blue-400/70');
    expect(resumeBuilderItemCardClassName).toContain('dark:hover:border-blue-500/50');
  });

  it('toggles tab selected chrome without dropping focus rings', () => {
    expect(resumeBuilderTabClassName(true)).toContain('bg-white');
    expect(resumeBuilderTabClassName(true)).toContain('dark:bg-gray-800');
    expect(resumeBuilderTabClassName(false)).toContain('hover:bg-white/70');
    expect(resumeBuilderTabClassName(false)).toContain('focus-visible:ring-2');
  });
});
