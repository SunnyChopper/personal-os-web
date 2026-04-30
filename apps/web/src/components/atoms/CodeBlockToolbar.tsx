import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockToolbarProps {
  code: string;
  language?: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CodeBlockToolbar({
  code,
  language,
  className,
  isCollapsed = false,
  onToggleCollapse,
}: CodeBlockToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div
      className={cn(
        'absolute top-2 right-2 flex items-center gap-2 z-10',
        // Always visible when collapsed, otherwise visible on hover
        isCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200',
        className
      )}
    >
      {language && (
        <span
          className={cn(
            'px-2 py-1 text-xs font-mono rounded',
            // Light mode: dark background with light text
            'bg-gray-800 text-gray-200',
            'dark:bg-gray-700 dark:text-gray-300'
          )}
        >
          {language}
        </span>
      )}
      {onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleCollapse?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapse?.();
            }
          }}
          className={cn(
            'p-1.5 rounded transition',
            // Light mode: dark background with light text
            'bg-gray-800 text-gray-200 hover:bg-gray-700',
            'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950'
          )}
          aria-label={isCollapsed ? 'Expand code block' : 'Collapse code block'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand code block' : 'Collapse code block'}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      )}
      <button
        onClick={handleCopy}
        className={cn(
          'p-1.5 rounded transition',
          // Light mode: dark background with light text
          'bg-gray-800 text-gray-200 hover:bg-gray-700',
          'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950'
        )}
        aria-label={copied ? 'Copied!' : 'Copy code'}
        title={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
