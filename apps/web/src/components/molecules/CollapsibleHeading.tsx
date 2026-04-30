import { useContext, createElement } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownSectionContext } from '@/contexts/MarkdownSectionContext';
import AnimatedSectionWrapper from '@/components/molecules/AnimatedSectionWrapper';

interface CollapsibleHeadingProps {
  level: 1 | 2 | 3 | 4;
  headingId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

// Heading level configuration
const headingConfig = {
  1: {
    iconSize: 16,
    marginTop: '',
    marginBottom: 'mb-1',
    paddingLeft: '',
    contentPadding: 'pl-0',
    textSize: 'text-3xl',
    fontWeight: 'font-bold',
  },
  2: {
    iconSize: 14,
    marginTop: '',
    marginBottom: 'mb-0.5',
    paddingLeft: 'pl-6',
    contentPadding: 'pl-6',
    textSize: 'text-2xl',
    fontWeight: 'font-bold',
  },
  3: {
    iconSize: 14,
    marginTop: '',
    marginBottom: 'mb-0.5',
    paddingLeft: 'pl-12',
    contentPadding: 'pl-12',
    textSize: 'text-xl',
    fontWeight: 'font-semibold',
  },
  4: {
    iconSize: 14,
    marginTop: '',
    marginBottom: 'mb-0.5',
    paddingLeft: 'pl-16',
    contentPadding: 'pl-16',
    textSize: 'text-lg',
    fontWeight: 'font-semibold',
  },
} as const;

/**
 * Reusable collapsible heading component for markdown rendering.
 * Supports levels 1-4 with appropriate styling and collapse functionality.
 */
export default function CollapsibleHeading({
  level,
  headingId,
  isCollapsed,
  onToggle,
  children,
  className,
}: CollapsibleHeadingProps) {
  // [Purpose] Access the MarkdownSectionContext to determine visibility
  //  and manage heading stack for collapsibility logic
  const sectionContext = useContext(MarkdownSectionContext);

  // [Purpose] Retrieve presentational configuration for this heading level
  const presentationConfig = headingConfig[level];

  // [Purpose] Determine if this heading should be rendered, considering
  // ancestral collapsed states (not its own collapsed state)
  // [Constraint] This check occurs before pushSection() so the stack tracks
  // only parent sections at this point
  const isVisible = sectionContext ? sectionContext.isHeadingVisible(headingId, level) : true;

  // [Purpose] Push this heading onto the context stack, informing subsequent
  // content and descendant headings
  sectionContext?.pushSection(headingId, level);

  // [Purpose] Dynamically select the appropriate heading tag (h1–h4) for
  // semantic/typographic correctness
  const headingTag = `h${level}`;

  return (
    <AnimatedSectionWrapper isVisible={isVisible}>
      <div
        className={cn(
          'markdown-heading-wrapper group',
          presentationConfig.marginTop,
          presentationConfig.marginBottom,
          presentationConfig.paddingLeft
        )}
      >
        <button
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          className={cn(
            'flex items-center gap-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-1.5 py-1 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
          )}
          aria-expanded={!isCollapsed}
          aria-controls={`section-${headingId}`}
        >
          {isCollapsed ? (
            <ChevronRight
              size={presentationConfig.iconSize}
              className="flex-shrink-0 text-gray-400 dark:text-gray-500"
            />
          ) : (
            <ChevronDown
              size={presentationConfig.iconSize}
              className="flex-shrink-0 text-gray-400 dark:text-gray-500"
            />
          )}
          {createElement(
            headingTag,
            {
              id: headingId,
              className: cn(
                presentationConfig.textSize,
                presentationConfig.fontWeight,
                'font-serif flex-1 m-0 leading-tight',
                className
              ),
            },
            children
          )}
        </button>
      </div>
    </AnimatedSectionWrapper>
  );
}
