import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

const SCALE_DURATION = 0.32;
const CHECK_DURATION = 0.45;

type GoodPickAffirmBurstProps = {
  /** Changes on each toggle-on to replay the affirmation. */
  pulseKey: number;
  children: ReactNode;
  className?: string;
};

export function GoodPickAffirmBurst({ pulseKey, children, className }: GoodPickAffirmBurstProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (shouldReduceMotion || pulseKey <= 0) {
    return <span className={className}>{children}</span>;
  }

  const scaleTransition = {
    duration: SCALE_DURATION,
    ease: [0.4, 0, 0.2, 1] as const,
  };

  const checkTransition = {
    duration: CHECK_DURATION,
    ease: [0.4, 0, 0.2, 1] as const,
  };

  return (
    <span className={`relative inline-flex items-center ${className ?? ''}`}>
      <motion.span
        key={`scale-${pulseKey}`}
        className="inline-flex"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={scaleTransition}
      >
        {children}
      </motion.span>
      <motion.span
        key={`check-${pulseKey}`}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-emerald-600 dark:text-emerald-400"
        initial={{ opacity: 0, y: 0, scale: 0.85 }}
        animate={{ opacity: [0, 1, 0], y: [-2, -14], scale: [0.85, 1, 0.9] }}
        transition={checkTransition}
      >
        <Check className="size-3.5" strokeWidth={2.5} />
      </motion.span>
    </span>
  );
}
