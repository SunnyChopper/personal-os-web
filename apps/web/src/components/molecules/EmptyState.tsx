import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import {
  EmptyStateScene,
  type EmptyStateSceneId,
} from '@/components/molecules/empty-state/EmptyStateScenes';

export type { EmptyStateSceneId };

interface EmptyStateProps {
  icon?: LucideIcon;
  scene?: EmptyStateSceneId;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'onboarding';
  onboardingSteps?: string[];
  proTips?: string[];
  className?: string;
}

function EmptyStateGraphic({
  scene,
  icon: Icon,
}: {
  scene?: EmptyStateSceneId;
  icon?: LucideIcon;
}) {
  if (scene) {
    return (
      <div className="relative mb-6 flex items-center justify-center">
        <div
          className="absolute inset-0 -m-6 rounded-3xl bg-gradient-to-b from-blue-50/80 via-gray-50/40 to-transparent dark:from-blue-950/30 dark:via-gray-900/20 dark:to-transparent"
          aria-hidden
        />
        <EmptyStateScene scene={scene} className="relative" />
      </div>
    );
  }

  if (!Icon) return null;

  return (
    <div className="relative mb-6 flex items-center justify-center">
      <div
        className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-b from-blue-50/60 via-gray-50/30 to-transparent dark:from-blue-950/20 dark:via-gray-900/10 dark:to-transparent"
        aria-hidden
      />
      <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700/80 dark:bg-gray-800/80">
        <Icon className="h-9 w-9 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  scene,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  onboardingSteps = [],
  proTips = [],
  className = '',
}: EmptyStateProps) {
  if (variant === 'onboarding') {
    return (
      <div className={`py-12 px-6 text-center ${className}`}>
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6 mx-auto border-4 border-white dark:border-gray-800 shadow-lg"
          >
            <Icon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </motion.div>
        )}

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {title}
        </motion.h3>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto"
          >
            {description}
          </motion.p>
        )}

        {/* Onboarding Steps */}
        {onboardingSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 text-left max-w-md mx-auto"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Getting Started
            </h4>
            <div className="space-y-3">
              {onboardingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pro Tips */}
        {proTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + onboardingSteps.length * 0.1 }}
            className="mb-8 text-left max-w-md mx-auto"
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-2">
                {proTips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
                  >
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        {(actionLabel || secondaryActionLabel) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + onboardingSteps.length * 0.1 }}
            className="flex gap-3 justify-center"
          >
            {actionLabel && onAction && (
              <Button onClick={onAction} variant="primary" size="lg">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button onClick={onSecondaryAction} variant="secondary" size="lg">
                {secondaryActionLabel}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  // Default variant — elevated layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-14 px-4 text-center ${className}`}
    >
      <EmptyStateGraphic scene={scene} icon={Icon} />

      <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="secondary">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
