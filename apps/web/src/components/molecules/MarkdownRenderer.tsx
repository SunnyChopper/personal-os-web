import React, { useContext, useEffect, useImperativeHandle, useRef, useMemo } from 'react';
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
import rehypeAssignMarkdownIds from '@/lib/markdown/rehype-markdown-ids';
import {
  MarkdownCodeBlockContext,
  MarkdownHeadingCollapseContext,
} from '@/contexts/MarkdownRenderContext';
import MarkdownSectionProvider from '@/components/molecules/MarkdownSectionProvider';
import MarkdownContentWrapper from '@/components/molecules/MarkdownContentWrapper';
import CollapsibleHeading from '@/components/molecules/CollapsibleHeading';
import MarkdownCodeBlock from '@/components/molecules/MarkdownCodeBlock';
import { createDefaultMarkdownComponents } from '@/lib/markdown/markdown-components';
import rehypeAddSourceLine from '@/components/molecules/rehype-add-source-line';

function pickDataSourceLine(props: Record<string, unknown>): string | number | undefined {
  const raw = props['data-source-line'] ?? props['dataSourceLine'];
  if (typeof raw === 'number' || typeof raw === 'string') return raw;
  return undefined;
}

function pickMarkdownId(node: { data?: { markdownId?: string } } | undefined): string {
  return node?.data?.markdownId ?? '';
}

function createHeadingComponent(level: 1 | 2 | 3 | 4): Components['h1'] {
  const HeadingComponent: Components['h1'] = ({ node, className, children, ...props }) => {
    const headingCollapse = useContext(MarkdownHeadingCollapseContext);
    const sourceLine = pickDataSourceLine(props as Record<string, unknown>);
    const headingId = pickMarkdownId(node);
    const isCollapsed = headingCollapse?.collapsedHeadings.has(headingId) ?? false;

    return (
      <CollapsibleHeading
        level={level}
        headingId={headingId}
        isCollapsed={isCollapsed}
        onToggle={() => headingCollapse?.toggleHeading(headingId)}
        className={className}
        sourceLine={sourceLine}
      >
        {children}
      </CollapsibleHeading>
    );
  };
  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

const MARKDOWN_HEADING_COMPONENTS = {
  h1: createHeadingComponent(1),
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
} satisfies Pick<Components, 'h1' | 'h2' | 'h3' | 'h4'>;

const MarkdownCode: Components['code'] = ({ className, children, ...props }) => {
  const { node } = props;
  const codeBlock = useContext(MarkdownCodeBlockContext);
  const sourceLine = pickDataSourceLine(props as Record<string, unknown>);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !className || !className.includes('language-');

  if (isInline || !codeBlock) {
    return (
      <code
        className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  const codeId = pickMarkdownId(node);
  const isCollapsed = codeBlock.collapsedCodeBlocks.has(codeId);
  const codeText = String(children).replace(/\n$/, '');

  // Code blocks should not be wrapped in MarkdownContentWrapper - they need full width
  return (
    <MarkdownCodeBlock
      code={codeText}
      language={language}
      className={className}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => codeBlock.toggleCodeBlock(codeId)}
      prismLoaded={codeBlock.prismLoaded}
      Prism={codeBlock.Prism}
      codeRefs={codeBlock.codeRefs}
      codeId={codeId}
      sourceLine={sourceLine}
    >
      {children}
    </MarkdownCodeBlock>
  );
};

export type MarkdownRendererVariant = 'default' | 'chat';

export interface MarkdownCollapseActionsHandle {
  expandAll: () => void;
  collapseAll: () => void;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: Partial<Components>;
  filePath?: string;
  /** Chat bubbles: line breaks, stable subtree key, layout tweaks. Default documents unchanged. */
  variant?: MarkdownRendererVariant;
  /** When set, MarkdownSectionProvider keys on this instead of content (avoids remount per streamed token). */
  contentKey?: string;
  /** Inject `data-source-line` on block elements for split-editor scroll sync (default false). */
  annotateSourceLines?: boolean;
  /** When true, YouTube links render as iframe embeds in preview (default false). */
  richEmbeds?: boolean;
  /** Optional ref for bulk expand/collapse of collapsible heading sections. */
  collapseActionsRef?: React.RefObject<MarkdownCollapseActionsHandle | null>;
}

export default function MarkdownRenderer({
  content,
  className,
  components: customComponents,
  filePath,
  variant = 'default',
  contentKey,
  annotateSourceLines = false,
  richEmbeds = false,
  collapseActionsRef,
}: MarkdownRendererProps) {
  const codeRefs = useRef<Map<string, HTMLPreElement>>(new Map());
  const { mathLoaded, prismLoaded, Prism } = useMarkdownPlugins(content);
  const collapseState = useMarkdownCollapseState(filePath);
  const rootRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    collapseActionsRef,
    () => ({
      expandAll: () => collapseState.resetState(),
      collapseAll: () => {
        const headingElements = rootRef.current?.querySelectorAll<HTMLElement>(
          '.markdown-heading-wrapper h1[id], .markdown-heading-wrapper h2[id], .markdown-heading-wrapper h3[id], .markdown-heading-wrapper h4[id]'
        );
        collapseState.collapseAll(Array.from(headingElements ?? [], (element) => element.id));
      },
    }),
    [collapseState]
  );

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
    if (annotateSourceLines) {
      plugins.push(rehypeAddSourceLine);
    }
    plugins.push(rehypeAssignMarkdownIds);
    return plugins;
  }, [annotateSourceLines, mathLoaded]);

  const collapsedHeadingsSet = collapseState.collapsedHeadings;

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

  const defaultComponents = useMemo(
    () =>
      createDefaultMarkdownComponents(
        MarkdownContentWrapper,
        MarkdownCode,
        MARKDOWN_HEADING_COMPONENTS,
        {
          richEmbeds,
        }
      ),
    [richEmbeds]
  );

  const headingCollapseValue = useMemo(
    () => ({
      collapsedHeadings: collapseState.collapsedHeadings,
      toggleHeading: collapseState.toggleHeading,
    }),
    [collapseState.collapsedHeadings, collapseState.toggleHeading]
  );

  const codeBlockValue = useMemo(
    () => ({
      collapsedCodeBlocks: collapseState.collapsedCodeBlocks,
      toggleCodeBlock: collapseState.toggleCodeBlock,
      prismLoaded,
      Prism,
      codeRefs,
    }),
    [collapseState.collapsedCodeBlocks, collapseState.toggleCodeBlock, prismLoaded, Prism]
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
      <MarkdownHeadingCollapseContext.Provider value={headingCollapseValue}>
        <MarkdownCodeBlockContext.Provider value={codeBlockValue}>
          <div
            ref={rootRef}
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
        </MarkdownCodeBlockContext.Provider>
      </MarkdownHeadingCollapseContext.Provider>
    </MarkdownSectionProvider>
  );
}
