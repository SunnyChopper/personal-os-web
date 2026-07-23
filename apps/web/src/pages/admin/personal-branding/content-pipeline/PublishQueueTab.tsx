import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { BrandPlatformChip } from '@/components/molecules/personal-branding/BrandPlatformChip';
import { PublishScheduleQuickEditor } from '@/components/molecules/personal-branding/PublishScheduleQuickEditor';
import { useToast } from '@/hooks/use-toast';
import {
  gridItemCardClassName,
  gridItemCardFocusWithinClassName,
  gridItemCardInteractiveClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { cn } from '@/lib/utils';
import type { ContentVariantDistributionStatus } from '@/types/api/personal-branding.dto';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  pbBodySecondaryClassName,
  pbCardTitleClassName,
  pbListStackClassName,
  pbMetaClassName,
  statusPillClassName,
} from '../personal-branding-ui';
import { formatPublishScheduleDisplay, isPublishScheduleOverdue } from './publish-schedule-presets';
import { usePublishQueue } from './usePublishQueue';

const PUBLISH_QUEUE_EXIT_MS = 220;

function PublishQueueStatusPills({
  scheduledPublishAt,
  publishReminderSentAt,
}: {
  scheduledPublishAt?: string | null;
  publishReminderSentAt?: string | null;
}) {
  const now = new Date();
  const hasSchedule = Boolean(scheduledPublishAt);
  const overdue = isPublishScheduleOverdue(scheduledPublishAt, now);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span
        className={cn(
          statusPillClassName(hasSchedule ? (overdue ? 'warning' : 'info') : 'muted'),
          'transition-[transform,opacity] duration-200'
        )}
      >
        {hasSchedule ? (overdue ? 'Past due' : 'Scheduled') : 'Unscheduled'}
      </span>
      {publishReminderSentAt ? (
        <span className={statusPillClassName('success')}>Reminder sent</span>
      ) : null}
    </div>
  );
}

export default function PublishQueueTab() {
  const queue = usePublishQueue();
  const { showToast, ToastContainer } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [scheduleFlashId, setScheduleFlashId] = useState<string | null>(null);

  const handleError = (error: unknown, title: string) => {
    showToast({
      type: 'error',
      title,
      message: error instanceof Error ? error.message : 'Please try again.',
    });
  };

  const saveSchedule = async (variantId: string, iso: string) => {
    try {
      await queue.updateStatus(variantId, 'SCHEDULED', {
        scheduledPublishAt: iso,
      });
      setScheduleFlashId(variantId);
      window.setTimeout(() => setScheduleFlashId(null), 600);
      showToast({ type: 'success', title: 'Publish time saved' });
    } catch (error) {
      handleError(error, "Couldn't save schedule");
      throw error;
    }
  };

  const clearTime = async (variantId: string) => {
    try {
      await queue.updateMutation.mutateAsync({
        variantId,
        scheduledPublishAt: null,
      });
      showToast({ type: 'success', title: 'Schedule cleared' });
    } catch (error) {
      handleError(error, "Couldn't clear schedule");
      throw error;
    }
  };

  const removeFromQueue = async (variantId: string) => {
    try {
      await queue.updateStatus(variantId, 'DRAFT');
      showToast({ type: 'success', title: 'Removed from queue' });
    } catch (error) {
      handleError(error, "Couldn't remove from queue");
    }
  };

  const markPublished = async (variantId: string) => {
    try {
      await queue.updateStatus(variantId, 'DEPLOYED' as ContentVariantDistributionStatus);
      showToast({ type: 'success', title: 'Marked published' });
    } catch (error) {
      handleError(error, "Couldn't mark as published");
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageCard>
        <SectionIntro
          title="Publish Queue"
          description="Cross-content queue for variants you plan to post manually. Set a publish time to receive an email reminder 30 minutes before."
        />
      </PageCard>

      {queue.isLoading ? (
        <p className={pbBodySecondaryClassName}>Loading queue…</p>
      ) : queue.items.length === 0 ? (
        <EmptyState
          scene="queueEmpty"
          title="Nothing queued yet"
          description="Add variants from the Repurposer tab after generation, or schedule them with a publish time."
        />
      ) : (
        <div className={pbListStackClassName}>
          <AnimatePresence mode="popLayout">
            {queue.items.map((variant) => {
              const isSaving =
                queue.updateMutation.isPending &&
                queue.updateMutation.variables?.variantId === variant.id;
              const sourceTitle =
                queue.sourceTitleById.get(variant.sourceContentId) ?? variant.sourceContentId;
              const scheduleLabel = formatPublishScheduleDisplay(variant.scheduledPublishAt);

              return (
                <motion.article
                  key={variant.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                  transition={{
                    duration: PUBLISH_QUEUE_EXIT_MS / 1000,
                    ease: 'easeInOut',
                  }}
                  className={cn(
                    gridItemCardClassName,
                    gridItemCardInteractiveClassName,
                    gridItemCardFocusWithinClassName,
                    scheduleFlashId === variant.id &&
                      'ring-2 ring-blue-400/50 dark:ring-blue-500/40'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <BrandPlatformChip platform={variant.platform} />
                      <h3 className={cn('mt-2', pbCardTitleClassName)}>{variant.title}</h3>
                      <PublishQueueStatusPills
                        scheduledPublishAt={variant.scheduledPublishAt}
                        publishReminderSentAt={variant.publishReminderSentAt}
                      />
                      <p className={cn('mt-2', pbMetaClassName)}>Source: {sourceTitle}</p>
                      <p className={cn('mt-1', pbBodySecondaryClassName)}>{scheduleLabel}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PublishScheduleQuickEditor
                        scheduledPublishAt={variant.scheduledPublishAt}
                        isSaving={isSaving}
                        onSave={(iso) => saveSchedule(variant.id, iso)}
                        onClear={() => clearTime(variant.id)}
                      />
                      {variant.scheduledPublishAt ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isSaving}
                          onClick={() => void clearTime(variant.id)}
                        >
                          Clear time
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isSaving}
                        onClick={() => void removeFromQueue(variant.id)}
                      >
                        Remove
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void markPublished(variant.id)}
                      >
                        Mark published
                      </Button>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'mt-4 line-clamp-4 whitespace-pre-wrap',
                      pbBodySecondaryClassName
                    )}
                  >
                    {variant.body}
                  </p>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
