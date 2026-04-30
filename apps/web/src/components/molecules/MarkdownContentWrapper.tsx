import { useContext } from 'react';
import { MarkdownSectionContext } from '@/contexts/MarkdownSectionContext';
import AnimatedSectionWrapper from '@/components/molecules/AnimatedSectionWrapper';
import { cn } from '@/lib/utils';

interface MarkdownContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

// Map heading levels to their indentation classes
// Content text should align with the heading text at each level.
//
// Heading text position calculation (from CollapsibleHeading):
// - Level 1: 0 (wrapper) + 6 (button px-1.5) + 16 (icon) + 8 (gap-2) = 30px
// - Level 2: 24 (pl-6) + 6 (button) + 14 (icon) + 8 (gap) = 52px
// - Level 3: 48 (pl-12) + 6 (button) + 14 (icon) + 8 (gap) = 76px
// - Level 4: 64 (pl-16) + 6 (button) + 14 (icon) + 8 (gap) = 92px
//
// Content wrapper has border (2px) + padding (pl-3 = 12px) = 14px before text
// So the wrapper div starts at: heading text position - 14px
const levelIndentation = {
  1: 'pl-[16px]', // 30px - 14px = 16px
  2: 'pl-[38px]', // 52px - 14px = 38px
  3: 'pl-[62px]', // 76px - 14px = 62px
  4: 'pl-[78px]', // 92px - 14px = 78px
} as const;

// Visual grouping styles for the inner content box
// Uses a subtle background and left border to show content hierarchy
// Note: pl-3 (12px) is the padding INSIDE the border, before the text
const VISUAL_GROUPING_CLASS =
  'border-l-2 border-gray-200 dark:border-gray-700 pl-3 bg-gray-50/30 dark:bg-gray-800/20 rounded-r';

/**
 * Content visibility component wrapper.
 * Checks if content should be visible based on the current section stack.
 * Applies indentation matching the current heading level.
 * Adds visual grouping with a left border to show content hierarchy.
 */
export default function MarkdownContentWrapper({
  children,
  className,
}: MarkdownContentWrapperProps) {
  const sectionContext = useContext(MarkdownSectionContext);
  // Check visibility based on current stack - pass empty string to check all parents
  const isVisible = sectionContext ? sectionContext.isContentVisible('') : true;

  // Get the current section level from context to apply matching indentation
  const currentLevel = sectionContext?.getCurrentLevel() ?? 1;
  const indentClass =
    levelIndentation[currentLevel as keyof typeof levelIndentation] || levelIndentation[1];

  return (
    <AnimatedSectionWrapper isVisible={isVisible}>
      {/* Outer div handles indentation (positions the left border) */}
      <div className={cn(indentClass, 'markdown-content-wrapper')}>
        {/* Inner div handles visual grouping (border + padding + background) */}
        <div className={cn(VISUAL_GROUPING_CLASS, className)}>{children}</div>
      </div>
    </AnimatedSectionWrapper>
  );
}
