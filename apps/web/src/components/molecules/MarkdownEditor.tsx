import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Link,
  Code,
  List,
  Heading1,
  Eye,
  Split,
  FileText,
  BookOpen,
  Loader,
  ArrowDownUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownRenderer from './MarkdownRenderer';
import { useTextareaLineOffsets } from '@/components/molecules/UseTextareaLineOffsets';
import {
  readPreviewBlocks,
  syncPreviewScrollToTextarea,
  syncTextareaScrollToPreview,
  type PreviewBlock,
} from '@/components/molecules/markdown-follow-scroll';

const FOLLOW_STORAGE_KEY = 'markdown-editor-follow-mode';

type ViewMode = 'split' | 'edit' | 'preview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  fullWidth?: boolean;
  onEnterReaderMode?: () => void;
  isLoading?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your note content here (supports Markdown)',
  minHeight = '400px',
  className,
  fullWidth = false,
  onEnterReaderMode,
  isLoading = false,
}: MarkdownEditorProps) {
  // Default to 'edit' mode on mobile, 'split' on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'split';
    return window.innerWidth >= 768 ? 'split' : 'edit';
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [followMode, setFollowMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
    return stored === null ? true : stored === '1';
  });

  useEffect(() => {
    window.localStorage.setItem(FOLLOW_STORAGE_KEY, followMode ? '1' : '0');
  }, [followMode]);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-switch to edit mode on mobile if in split mode
      if (mobile && viewMode === 'split') {
        setViewMode('edit');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<PreviewBlock[]>([]);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const followScrollActive = followMode && viewMode === 'split' && !isMobile;
  const { apiRef: lineMirrorApiRef, MirrorLayer } = useTextareaLineOffsets(
    textareaRef,
    value,
    followScrollActive
  );

  const beginProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current !== undefined) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      programmaticScrollTimerRef.current = undefined;
    }, 60);
  }, []);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimerRef.current !== undefined) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode !== 'split') {
      blocksRef.current = [];
      return;
    }
    const root = previewRef.current;
    if (!root) return;

    let raf = 0;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        blocksRef.current = readPreviewBlocks(root);
        if (import.meta.env.DEV && value.trim()) {
          const annotated = root.querySelector('[data-source-line]');
          if (annotated && root.scrollHeight <= root.clientHeight + 1) {
            console.warn(
              '[MarkdownEditor] Follow mode: preview pane may not be scrolling (nested overflow?).'
            );
          }
        }
      });
    };

    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(root, { subtree: true, childList: true, attributes: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    return () => {
      mo.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [viewMode, value]);

  useEffect(() => {
    if (!followScrollActive) return;
    const id = requestAnimationFrame(() => {
      const ta = textareaRef.current;
      const pv = previewRef.current;
      const api = lineMirrorApiRef.current;
      if (!ta || !pv || !api) return;
      const blocks = readPreviewBlocks(pv);
      blocksRef.current = blocks;
      if (blocks.length === 0) return;
      beginProgrammaticScroll();
      syncTextareaScrollToPreview(ta, pv, api, blocks);
    });
    return () => cancelAnimationFrame(id);
  }, [followScrollActive, value, beginProgrammaticScroll, lineMirrorApiRef]);

  useEffect(() => {
    if (!followScrollActive) return;
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;

    const onTextareaScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      const api = lineMirrorApiRef.current;
      if (!api) return;
      let blocks = blocksRef.current;
      if (blocks.length === 0) {
        blocks = readPreviewBlocks(pv);
        blocksRef.current = blocks;
      }
      if (blocks.length === 0) return;
      beginProgrammaticScroll();
      syncTextareaScrollToPreview(ta, pv, api, blocks);
    };

    const onPreviewScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      const api = lineMirrorApiRef.current;
      if (!api) return;
      let blocks = blocksRef.current;
      if (blocks.length === 0) {
        blocks = readPreviewBlocks(pv);
        blocksRef.current = blocks;
      }
      if (blocks.length === 0) return;
      beginProgrammaticScroll();
      syncPreviewScrollToTextarea(ta, pv, api, blocks);
    };

    ta.addEventListener('scroll', onTextareaScroll, { passive: true });
    pv.addEventListener('scroll', onPreviewScroll, { passive: true });
    return () => {
      ta.removeEventListener('scroll', onTextareaScroll);
      pv.removeEventListener('scroll', onPreviewScroll);
    };
  }, [followScrollActive, beginProgrammaticScroll, lineMirrorApiRef]);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertText('**', '**');
    }
    // Cmd/Ctrl + I for italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertText('_', '_');
    }
    // Cmd/Ctrl + K for link
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      insertText('[', '](url)');
    }
  };

  const calculateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = value.length;
  const readingTime = calculateReadingTime(value);

  const showSplitChrome = viewMode === 'split' && !isMobile;

  return (
    <div
      className={cn(
        'flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden h-full',
        className
      )}
    >
      {/* Toolbar - Sticky to stay visible when scrolling */}
      <div className="sticky top-0 z-10 flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-hidden min-h-[48px] h-auto">
        {/* Formatting buttons - left side */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => insertText('**', '**')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Bold (Cmd/Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => insertText('_', '_')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Italic (Cmd/Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => insertText('[', '](url)')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Link (Cmd/Ctrl+K)"
            aria-label="Link"
          >
            <Link size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Inline Code"
            aria-label="Inline Code"
          >
            <Code size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => insertText('- ', '')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => insertText('# ', '')}
            className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
            title="Heading"
            aria-label="Heading"
          >
            <Heading1 size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Spacer to push right side to the end when there's space */}
        <div className="flex-1 min-w-0" />

        {/* Stats and view mode buttons - right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Hide word count on mobile and smaller tablets to save space */}
          <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
            {wordCount} words · {charCount} chars · {readingTime} min read
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 border-l border-gray-300 dark:border-gray-700 pl-2 sm:pl-3 ml-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={cn(
                'flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded transition',
                viewMode === 'edit'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}
              title="Edit Mode"
              aria-label="Edit Mode"
            >
              <FileText size={16} />
            </button>
            {/* Hide split view on mobile */}
            {!isMobile && (
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded transition',
                  viewMode === 'split'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
                title="Split View"
                aria-label="Split View"
              >
                <Split size={16} />
              </button>
            )}
            {showSplitChrome && (
              <button
                type="button"
                onClick={() => setFollowMode((v) => !v)}
                className={cn(
                  'flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded transition',
                  followMode
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
                title="Follow scroll (sync editor and preview)"
                aria-label="Follow scroll (sync editor and preview)"
                aria-pressed={followMode}
              >
                <ArrowDownUp size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded transition',
                viewMode === 'preview'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}
              title="Preview Mode"
              aria-label="Preview Mode"
            >
              <Eye size={16} />
            </button>
            {onEnterReaderMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEnterReaderMode();
                }}
                className="flex-shrink-0 p-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded transition hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                title="Open in Full-Screen Reader Mode"
                aria-label="Open in Full-Screen Reader Mode"
              >
                <BookOpen size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex flex-1 overflow-hidden min-h-0" style={{ minHeight }}>
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={cn(
              'flex-1 flex flex-col min-h-0',
              showSplitChrome && 'border-r border-gray-200 dark:border-gray-700',
              followScrollActive && 'relative'
            )}
          >
            {MirrorLayer}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'flex-1 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none focus:outline-none overflow-y-auto',
                fullWidth ? 'px-8 pt-6 pb-32' : 'px-4 pt-3 pb-24',
                followScrollActive && 'relative z-[1]'
              )}
              style={{ minHeight }}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            ref={previewRef}
            data-testid="markdown-editor-preview"
            className={cn(
              'flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900',
              viewMode === 'preview' && 'w-full',
              fullWidth ? 'px-8 pt-6 pb-32' : 'px-4 pt-3 pb-24'
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : value.trim() ? (
              <MarkdownRenderer content={value} annotateSourceLines={showSplitChrome} />
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">{placeholder}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
