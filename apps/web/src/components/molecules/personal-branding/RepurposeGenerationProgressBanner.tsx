import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import {
  pbBannerTitleClassName,
  pbBodySecondaryClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import {
  repurposeBatchProgress,
  repurposeGenerationBannerLabel,
} from '@/lib/personal-branding/repurpose-generation-progress';
import type { RepurposeJob } from '@/types/api/personal-branding.dto';

interface RepurposeGenerationProgressBannerProps {
  batchJobs: RepurposeJob[];
  onCancel: () => void;
  isCancelling?: boolean;
  className?: string;
}

export default function RepurposeGenerationProgressBanner({
  batchJobs,
  onCancel,
  isCancelling = false,
  className,
}: RepurposeGenerationProgressBannerProps) {
  const { total, completed, inFlightCount, percent } = repurposeBatchProgress(batchJobs);
  if (inFlightCount === 0) return null;

  const label = repurposeGenerationBannerLabel(inFlightCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white p-5 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-gray-900/40',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Variant generation progress"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={pbBannerTitleClassName}>{label}</p>
          <p className={cn('mt-1', pbBodySecondaryClassName, 'text-xs')}>
            {completed} of {total} complete
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isCancelling}
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-2"
        >
          {isCancelling ? <Loader2 size={14} className="animate-spin" /> : null}
          Cancel generation
        </Button>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/40"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300 dark:bg-blue-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </motion.div>
  );
}
