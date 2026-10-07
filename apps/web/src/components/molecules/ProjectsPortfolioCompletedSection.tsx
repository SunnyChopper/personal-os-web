import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ProjectsPortfolioCompletedSectionProps = {
  count: number;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ProjectsPortfolioCompletedSection({
  count,
  children,
  className,
  contentClassName,
  defaultOpen = false,
  isOpen: controlledOpen,
  onOpenChange,
}: ProjectsPortfolioCompletedSectionProps) {
  const headingId = useId();
  const panelId = `${headingId}-panel`;
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        className="mb-3 flex w-full items-center gap-1.5 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
        )}
        <span
          id={headingId}
          className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
        >
          Completed ({count})
        </span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        initial={false}
        animate={
          shouldReduceMotion
            ? { height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }
            : isOpen
              ? 'visible'
              : 'hidden'
        }
        variants={{
          visible: {
            height: 'auto',
            opacity: 1,
            transition: { duration: 0.2, ease: 'easeOut' },
          },
          hidden: {
            height: 0,
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeOut' },
          },
        }}
        className={cn('overflow-hidden', !isOpen && 'pointer-events-none')}
      >
        <div className={contentClassName}>{children}</div>
      </motion.div>
    </div>
  );
}
