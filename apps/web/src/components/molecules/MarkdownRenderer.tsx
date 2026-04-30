import React, { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { PluggableList } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { useMarkdownCollapseState } from '@/hooks/useMarkdownCollapseState';
import { useMarkdownPlugins } from '@/hooks/useMarkdownPlugins';
import { getRemarkMath, getRehypeKatex } from '@/lib/markdown/plugins';
import { extractTextFromNode, generateHeadingId } from '@/lib/markdown/heading-utils';
import MarkdownSectionProvider from '@/components/molecules/MarkdownSectionProvider';
import MarkdownContentWrapper from '@/components/molecules/MarkdownContentWrapper';
import CollapsibleHeading from '@/components/molecules/CollapsibleHeading';
import MarkdownCodeBlock from '@/components/molecules/MarkdownCodeBlock';
import { createDefaultMarkdownComponents } from '@/lib/markdown/markdown-components';

export type MarkdownRendererVariant = 'default' | 'chat';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: Partial<Components>;
  filePath?: string;
  /** Chat bubbles: line breaks, stable subtree key, layout tweaks. Default documents unchanged. */
  variant?: MarkdownRendererVariant;
  /** When set, MarkdownSectionProvider keys on this instead of content (avoids remount per streamed token). */
  contentKey?: string;
}

export default function MarkdownRenderer({
  content,
  className,
  components: customComponents,
  filePath,
  variant = 'default',
  contentKey,
}: MarkdownRendererProps) {
  const codeRefs = useRef<Map<string, HTMLPreElement>>(new Map());
  const { mathLoaded, prismLoaded, Prism } = useMarkdownPlugins(content);
  const collapseState = useMarkdownCollapseState(filePath);

  // Map to track heading IDs for stability across re-renders
  // Key: `${level}-${textHash}` or `${level}-${textHash}-${occurrence}`, Value: full heading ID with counter
  // This ensures the same heading always gets the same ID
  const headingIdMapRef = useRef<Map<string, string>>(new Map());
  const headingCountersRef = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  // Map to track how many times we've seen each unique heading text at each level
  // Key: `${level}-${textHash}`, Value: occurrence count
  const headingOccurrenceMapRef = useRef<Map<string, number>>(new Map());
  const codeBlockCounterRef = useRef(0);
  const codeBlockIdGeneratorRef = useRef(0);

  // Reset ID map and counters ONLY when content changes
  // This ensures heading IDs remain stable across re-renders caused by collapse state changes
  useEffect(() => {
    headingIdMapRef.current.clear();
    headingCountersRef.current = { 1: 0, 2: 0, 3: 0, 4: 0 };
    headingOccurrenceMapRef.current.clear();
    codeBlockCounterRef.current = 0;
    codeBlockIdGeneratorRef.current = 0;
  }, [content]);

  // Highlight existing code blocks when Prism loads
  useEffect(() => {
    if (prismLoaded && Prism) {
      setTimeout(() => {
        codeRefs.current.forEach((preElement) => {
          const codeElement = preElement.querySelector('code');
          if (codeElement && !codeElement.classList.contains('prism-highlighted')) {
            const language =
              codeElement.getAttribute('data-language') ||
              codeElement.className.replace(/language-?/, '');
            if (language && Prism.languages[language]) {
              try {
                const code = codeElement.textContent || '';
                codeElement.innerHTML = Prism.highlight(code, Prism.languages[language], language);
                codeElement.classList.add('prism-highlighted');
              } catch {
                // Failed to highlight, continue without highlighting
              }
            }
          }
        });
      }, 0);
    }
  }, [prismLoaded, Prism, content]);

  // Build plugins array dynamically (chat: GFM + remark-breaks so single newlines become <br>)
  const remarkPlugins = useMemo((): PluggableList => {
    const plugins: PluggableList = [remarkGfm];
    if (variant === 'chat') {
      plugins.push(remarkBreaks);
    }
    const remarkMath = getRemarkMath();
    if (mathLoaded && remarkMath) {
      plugins.push(remarkMath);
    }
    return plugins;
  }, [mathLoaded, variant]);

  const rehypePlugins = useMemo((): PluggableList => {
    const plugins: PluggableList = [rehypeRaw];
    const rehypeKatex = getRehypeKatex();
    if (mathLoaded && rehypeKatex) {
      plugins.push(rehypeKatex);
    }
    return plugins;
  }, [mathLoaded]);

  // Get collapsed headings set for efficient lookups
  const collapsedHeadingsSet = collapseState.collapsedHeadings;

  // Reset occurrence map at the start of each render to track heading order correctly
  // This ensures we process headings in order and assign occurrence indices correctly
  // The headingIdMap persists across re-renders (when content doesn't change) to maintain stable IDs
  // Using useLayoutEffect to clear before render, satisfying React's ref mutation rules
  useLayoutEffect(() => {
    headingOccurrenceMapRef.current.clear();
  });

  // Create heading component factory
  // Note: Refs are accessed during component render (not creation), which is safe for ID generation
  const createHeadingComponent = useMemo(
    () => (level: 1 | 2 | 3 | 4) => {
      const HeadingComponent = ({ className, children }: React.ComponentProps<'h1'>) => {
        const textContent = extractTextFromNode(children ?? '');
        // Reading refs during render is safe here - we're not mutating them, only reading for stable IDs
        const headingId = generateHeadingId(
          level,
          textContent,
          headingIdMapRef.current,
          headingCountersRef.current,
          headingOccurrenceMapRef.current
        );
        const isCollapsed = collapsedHeadingsSet.has(headingId);

        return (
          <CollapsibleHeading
            level={level}
            headingId={headingId}
            isCollapsed={isCollapsed}
            onToggle={() => collapseState.toggleHeading(headingId)}
            className={className}
          >
            {children}
          </CollapsibleHeading>
        );
      };
      HeadingComponent.displayName = `Heading${level}`;
      return HeadingComponent;
    },
    [collapsedHeadingsSet, collapseState]
  );

  // Create pre component - handles the wrapper for code blocks
  // For fenced code blocks, we pass through children since our code component creates the pre
  // For other pre elements, wrap them normally
  const preComponent = useMemo<Components['pre']>(() => {
    const PreComponent: Components['pre'] = ({ children, ...props }) => {
      // Check if this pre contains a code element with a language class (fenced code block)
      // If so, our code component will handle creating the pre, so we just pass through the children
      if (React.isValidElement(children) && children.type === 'code') {
        const codeProps = children.props as { className?: string };
        if (typeof codeProps.className === 'string' && codeProps.className.includes('language-')) {
          // Pass through children - the code component will create the pre element with proper wrapping
          return <>{children}</>;
        }
      }

      // For other pre elements (not fenced code blocks), wrap normally
      return (
        <MarkdownContentWrapper>
          <pre {...props}>{children}</pre>
        </MarkdownContentWrapper>
      );
    };
    return PreComponent;
  }, []);

  // Create div component - handles math-display elements
  const divComponent = useMemo<Components['div']>(() => {
    const DivComponent: Components['div'] = ({ className, children, ...props }) => {
      let isMathDisplay = false;
      if (className) {
        if (typeof className === 'string') {
          isMathDisplay = className.includes('math-display');
        } else if (Array.isArray(className)) {
          const classNameArray = className as Array<string | number | boolean | null | undefined>;
          isMathDisplay = classNameArray.some(
            (c) => typeof c === 'string' && c.includes('math-display')
          );
        }
      }

      if (isMathDisplay) {
        const classNames = typeof className === 'string' ? className : undefined;
        return (
          <div className={cn('math-display', classNames)} {...props}>
            {children}
          </div>
        );
      }

      // For other divs, render normally
      const classNames = typeof className === 'string' ? className : undefined;
      return (
        <div className={classNames} {...props}>
          {children}
        </div>
      );
    };
    return DivComponent;
  }, []);

  // Create code component
  const codeComponent = useMemo<Components['code']>(() => {
    const CodeComponent: Components['code'] = ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isInline = !className || !className.includes('language-');

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      // Generate code block ID using a counter
      // Note: Mutating refs during render is intentional here for ID generation
      // This is safe because IDs are only used for tracking collapsed state, not for rendering logic

      const codeId = `code-${codeBlockIdGeneratorRef.current}`;

      codeBlockIdGeneratorRef.current += 1;
      const isCollapsed = collapseState.collapsedCodeBlocks.has(codeId);
      const codeText = String(children).replace(/\n$/, '');

      // Code blocks should not be wrapped in MarkdownContentWrapper - they need full width
      return (
        <MarkdownCodeBlock
          code={codeText}
          language={language}
          className={className}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => collapseState.toggleCodeBlock(codeId)}
          prismLoaded={prismLoaded}
          Prism={Prism}
          codeRefs={codeRefs}
          codeId={codeId}
        >
          {children}
        </MarkdownCodeBlock>
      );
    };
    return CodeComponent;
  }, [collapseState, prismLoaded, Prism]);

  // Create default components
  // Note: The components created here will access refs during their render phase (not during this useMemo),
  // which is safe because we only read refs for stable ID generation, never mutate them.
  // The React compiler warning below is a false positive - refs are only read (not mutated) for ID generation.
  // This is intentional and safe: we need stable IDs across re-renders, and reading refs doesn't cause issues.
  // Refs are only read (not mutated) during component render for stable ID generation.
  // This is safe and intentional - components need access to refs to generate consistent IDs.
  const defaultComponents = useMemo(
    () =>
      createDefaultMarkdownComponents(MarkdownContentWrapper, codeComponent, {
        h1: createHeadingComponent(1) as Components['h1'],
        h2: createHeadingComponent(2) as Components['h2'],
        h3: createHeadingComponent(3) as Components['h3'],
        h4: createHeadingComponent(4) as Components['h4'],
      }),
    [createHeadingComponent, codeComponent]
  );

  // Merge custom components with defaults (custom takes precedence)
  const mergedComponents = useMemo(
    () => ({
      ...defaultComponents,
      ...customComponents,
      // Ensure code, pre, and div components are always from defaults
      // (for syntax highlighting, indentation, and math display)
      code: defaultComponents.code,
      pre: preComponent,
      div: divComponent,
    }),
    [defaultComponents, customComponents, preComponent, divComponent]
  );

  const sectionProviderKey = contentKey ?? content;

  return (
    <MarkdownSectionProvider key={sectionProviderKey} collapsedHeadings={collapsedHeadingsSet}>
      <div
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none prose-headings:font-serif',
          'prose-headings:mt-0 prose-headings:mb-0',
          'prose-h1:mt-0 prose-h1:mb-0',
          'prose-h2:mt-0 prose-h2:mb-0',
          'prose-h3:mt-0 prose-h3:mb-0',
          'prose-h4:mt-0 prose-h4:mb-0',
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0.5',
          'prose-blockquote:my-2',
          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          variant === 'chat' &&
            'min-w-0 w-full max-w-full break-words prose-headings:font-sans prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:font-medium prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-pre:!my-2 prose-hr:!my-2',
          className
        )}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={mergedComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownSectionProvider>
  );
}
