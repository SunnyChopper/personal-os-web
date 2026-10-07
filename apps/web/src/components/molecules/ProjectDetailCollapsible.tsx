import { useId, useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  formatDetailSectionTitle,
  projectDetailHeaderButtonClassName,
  projectDetailSectionBodyClassName,
  projectDetailSectionClassName,
  type ProjectDetailCollapsibleTone,
} from '@/lib/projects/project-detail-surfaces';

export interface ProjectDetailCollapsibleProps {
  title: string;
  count?: number | null;
  suffix?: ReactNode;
  icon?: ComponentType<{ className?: string; size?: number }>;
  iconClassName?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  tone?: ProjectDetailCollapsibleTone;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  id?: string;
}

export function ProjectDetailCollapsible({
  title,
  count,
  suffix,
  icon: Icon,
  iconClassName,
  defaultOpen = false,
  isOpen: controlledOpen,
  onOpenChange,
  tone = 'default',
  children,
  className,
  headerClassName,
  bodyClassName,
  id: customId,
}: ProjectDetailCollapsibleProps) {
  const generatedId = useId();
  const id = customId ?? generatedId;
  const headingId = `${id}-heading`;
  const panelId = `${id}-panel`;

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

  const displayTitle = formatDetailSectionTitle(title, count);

  return (
    <div className={cn(projectDetailSectionClassName, className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(projectDetailHeaderButtonClassName(tone), headerClassName)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon size={18} className={cn('shrink-0', iconClassName)} /> : null}
          <span id={headingId} className="truncate">
            {displayTitle}
          </span>
          {suffix ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal shrink-0">
              {suffix}
            </span>
          ) : null}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="shrink-0 text-gray-400" aria-hidden />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-gray-400" aria-hidden />
        )}
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
        <div className={cn(projectDetailSectionBodyClassName, bodyClassName)}>{children}</div>
      </motion.div>
    </div>
  );
}
