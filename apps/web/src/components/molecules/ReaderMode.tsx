import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownRenderer from './MarkdownRenderer';

interface ReaderModeProps {
  title: string;
  path?: string;
  content: string;
  onClose: () => void;
}

export default function ReaderMode({ title, path, content, onClose }: ReaderModeProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Memoize the MarkdownRenderer to prevent re-renders during scroll
  // This is critical - scroll state changes should not cause markdown re-renders
  const memoizedMarkdownRenderer = useMemo(
    () => <MarkdownRenderer content={content} filePath={path} />,
    [content, path]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);

      // Show/hide header based on scroll direction
      if (scrollTop < 50) {
        setShowHeader(true);
      } else if (scrollTop > lastScrollY.current) {
        // Scrolling down
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      lastScrollY.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ESC key to exit
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const readerModeContent = (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 overflow-hidden">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gray-200/50 dark:bg-gray-800/50 z-[10000]">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-150 ease-out shadow-sm"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header - Fades in/out on scroll */}
      <div
        className={cn(
          'fixed top-0.5 left-0 right-0 z-[9998] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-800/30 transition-all duration-300 ease-in-out shadow-sm',
          showHeader
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-gray-900 dark:text-white mb-1 truncate leading-tight">
                {title}
              </h1>
              {path && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-mono">
                  {path}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-all duration-200"
              title="Exit reader mode (ESC)"
              aria-label="Exit reader mode"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto pt-20 pb-16 scroll-smooth reader-scrollbar"
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          {/* Elegant Typography Container */}
          <article className="prose prose-lg sm:prose-xl dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:tracking-tight prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-[1.75] prose-p:tracking-wide prose-p:text-[18px] sm:prose-p:text-[20px] prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold prose-code:text-gray-900 dark:prose-code:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 dark:prose-pre:bg-gray-950 prose-pre:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:not-italic prose-blockquote:font-normal prose-ul:space-y-2 prose-ol:space-y-2 prose-li:marker:text-gray-400 dark:prose-li:marker:text-gray-600">
            {memoizedMarkdownRenderer}
          </article>
        </div>
      </div>

      {/* Floating Exit Button - Always visible */}
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 transition-all duration-200 group hover:scale-105"
        title="Exit reader mode (ESC)"
        aria-label="Exit reader mode"
      >
        <XCircle size={18} className="group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-sm font-medium hidden sm:inline">Exit</span>
      </button>
    </div>
  );

  // Render via portal to ensure it's above all other content
  return createPortal(readerModeContent, document.body);
}
