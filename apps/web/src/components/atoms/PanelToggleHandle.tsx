import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelToggleHandleProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
}

export default function PanelToggleHandle({
  collapsed,
  onToggle,
  className,
  label = 'Toggle content library',
}: PanelToggleHandleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
        className
      )}
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  );
}
