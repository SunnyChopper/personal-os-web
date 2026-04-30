import { cn } from '@/lib/utils';
import CodeBlockToolbar from '@/components/atoms/CodeBlockToolbar';

interface MarkdownCodeBlockProps {
  code: string;
  language: string;
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  prismLoaded: boolean;
  Prism: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  codeRefs: React.MutableRefObject<Map<string, HTMLPreElement>>;
  codeId: string;
  children: React.ReactNode;
}

/**
 * Code block component for markdown rendering.
 * Handles syntax highlighting with Prism, collapse state, and toolbar functionality.
 */
export default function MarkdownCodeBlock({
  code,
  language,
  className,
  isCollapsed,
  onToggleCollapse,
  prismLoaded,
  Prism,
  codeRefs,
  codeId,
  children,
}: MarkdownCodeBlockProps) {
  const codeText = code.replace(/\n$/, '');
  const codeLines = codeText.split('\n');
  const previewLines = codeLines.slice(0, 3);
  const hasMoreLines = codeLines.length > 3;

  return (
    <pre
      ref={(el) => {
        if (el) {
          codeRefs.current.set(codeId, el);
          // Try to highlight immediately if Prism is loaded
          if (prismLoaded && Prism) {
            setTimeout(() => {
              const codeEl = el.querySelector('code');
              if (codeEl && !codeEl.classList.contains('prism-highlighted')) {
                const lang = language || codeEl.className.replace(/language-?/, '');
                if (lang && Prism.languages[lang]) {
                  try {
                    codeEl.innerHTML = Prism.highlight(
                      codeEl.textContent || '',
                      Prism.languages[lang],
                      lang
                    );
                    codeEl.classList.add('prism-highlighted');
                  } catch {
                    // Ignore highlighting errors
                  }
                }
              }
            }, 0);
          }
        } else {
          codeRefs.current.delete(codeId);
        }
      }}
      className={cn(
        'relative group rounded-lg overflow-x-auto my-4 transition-all duration-200',
        // Light mode: light background with dark text
        'bg-gray-50 border border-gray-200',
        'dark:bg-gray-950 dark:border-gray-800',
        // Hover states
        'hover:bg-gray-100 dark:hover:bg-gray-900',
        // Padding - reduced to prevent excessive spacing
        'p-3',
        // Collapse state - constrain height when collapsed
        isCollapsed && 'overflow-hidden'
      )}
      data-language={language}
    >
      <CodeBlockToolbar
        code={codeText}
        language={language}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <code
        id={codeId}
        className={cn(
          'block text-sm font-mono transition-all duration-200',
          // Light mode: dark text on light background
          'text-gray-900 dark:text-gray-100',
          // Remove all padding/margin to prevent nesting issues
          'p-0 m-0',
          isCollapsed && 'max-h-24 overflow-hidden',
          className
        )}
        data-language={language}
      >
        {isCollapsed ? (
          <>
            {/* For blocks with 3 or fewer lines, show first 2 lines; otherwise show first 3 */}
            {codeLines.length <= 3 ? previewLines.slice(0, 2).join('\n') : previewLines.join('\n')}
            {hasMoreLines && (
              <>
                {'\n'}
                <span className="text-gray-500 dark:text-gray-400 italic">
                  ... ({codeLines.length - 3} more lines)
                </span>
              </>
            )}
            {!hasMoreLines && codeLines.length > 0 && (
              <span className="text-gray-500 dark:text-gray-400 italic ml-2">(collapsed)</span>
            )}
          </>
        ) : (
          children
        )}
      </code>
    </pre>
  );
}
