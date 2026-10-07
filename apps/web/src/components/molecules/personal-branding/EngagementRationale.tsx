import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EngagementRationaleProps {
  lead?: string | null;
  bullets?: string[] | null;
  className?: string;
  leadClassName?: string;
  bulletClassName?: string;
  /** When true (default), bullets render behind a default-closed "Why this matters" expander. */
  collapsibleBullets?: boolean;
  /** Initial open state for the bullets panel when collapsible (default false). */
  defaultBulletsOpen?: boolean;
}

export default function EngagementRationale({
  lead,
  bullets,
  className,
  leadClassName = 'text-sm text-gray-600 dark:text-gray-300',
  bulletClassName = 'text-sm text-gray-500 dark:text-gray-400',
  collapsibleBullets = true,
  defaultBulletsOpen = false,
}: EngagementRationaleProps) {
  const leadText = lead?.trim();
  const bulletItems = (bullets ?? []).map((item) => item.trim()).filter(Boolean);
  const [bulletsOpen, setBulletsOpen] = useState(defaultBulletsOpen);
  const shouldReduceMotion = useReducedMotion();
  const panelId = useId();

  if (!leadText && bulletItems.length === 0) {
    return null;
  }

  const bulletList = (
    <ul className={cn('list-disc space-y-1 pl-5', bulletClassName)}>
      {bulletItems.map((item) => (
        <li key={item} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  );

  const showCollapsibleBullets = collapsibleBullets && bulletItems.length > 0;

  return (
    <div className={cn('min-w-0', className)}>
      {leadText ? <p className={cn('break-words', leadClassName)}>{leadText}</p> : null}
      {bulletItems.length > 0 && !showCollapsibleBullets ? (
        <div className={cn(leadText ? 'mt-1.5' : undefined)}>{bulletList}</div>
      ) : null}
      {showCollapsibleBullets ? (
        <div className={cn(leadText ? 'mt-1.5' : undefined)}>
          <button
            type="button"
            onClick={() => setBulletsOpen((prev) => !prev)}
            className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-xs font-medium text-gray-600 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:bg-gray-800/40"
            aria-expanded={bulletsOpen}
            aria-controls={panelId}
          >
            {bulletsOpen ? (
              <ChevronDown className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            )}
            <span>Why this matters</span>
          </button>
          <motion.div
            id={panelId}
            role="region"
            aria-hidden={!bulletsOpen}
            inert={!bulletsOpen ? true : undefined}
            initial={false}
            animate={
              shouldReduceMotion
                ? { height: bulletsOpen ? 'auto' : 0, opacity: bulletsOpen ? 1 : 0 }
                : bulletsOpen
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
            className="overflow-hidden"
          >
            {bulletsOpen ? <div className="px-1 pt-1">{bulletList}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
