import { type ReactNode, useRef, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedSectionWrapperProps {
  isVisible: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedSectionWrapper - Wraps content with smooth expand/collapse animations
 *
 * Uses framer-motion to animate height changes when content visibility changes.
 * Respects reduced motion preferences and provides smooth 300ms transitions.
 *
 * Uses 'auto' height for visible state to handle dynamic content without
 * causing re-animations during scroll or content changes.
 * Content remains mounted to preserve state and improve performance.
 */
export default function AnimatedSectionWrapper({
  isVisible,
  children,
  className,
}: AnimatedSectionWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference (memoized to avoid recalculation)
  const prefersReducedMotion = useMemo(() => {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  // Animation variants - use 'auto' for visible height to handle dynamic content
  const variants: Variants = useMemo(
    () => ({
      visible: {
        height: 'auto',
        opacity: 1,
        transition: {
          height: {
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: 'easeInOut',
          },
          opacity: {
            duration: prefersReducedMotion ? 0 : 0.2,
            ease: 'easeInOut',
          },
        },
      },
      hidden: {
        height: 0,
        opacity: 0,
        transition: {
          height: {
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: 'easeInOut',
          },
          opacity: {
            duration: prefersReducedMotion ? 0 : 0.2,
            ease: 'easeInOut',
          },
        },
      },
    }),
    [prefersReducedMotion]
  );

  return (
    <motion.div
      initial={false} // Prevents initial animation on mount
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants}
      className={cn('overflow-hidden', className)}
      // Use layout={false} to prevent layout animations during scroll
      layout={false}
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}
