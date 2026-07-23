import type { ContentVariant } from '@/types/api/personal-branding.dto';
import { variantInWorkbench } from './variant-workbench-helpers';

export interface BulkVariantSuccess {
  variantId: string;
}

export interface BulkVariantFailure {
  variantId: string;
  error: string;
}

export interface BulkVariantOutcome {
  succeeded: BulkVariantSuccess[];
  failed: BulkVariantFailure[];
}

export interface SandboxEligibility {
  eligible: ContentVariant[];
  skippedInWorkbench: number;
}

export interface MarkReadyEligibility {
  eligible: ContentVariant[];
  skippedRejected: number;
  skippedAlreadyReady: number;
}

export interface QueueEligibility {
  eligible: ContentVariant[];
  skippedRejected: number;
  skippedAlreadyQueued: number;
}

export interface RejectEligibility {
  eligible: ContentVariant[];
  skippedAlreadyRejected: number;
}

export function partitionBulkVariantResults(
  variantIds: string[],
  results: PromiseSettledResult<unknown>[]
): BulkVariantOutcome {
  const succeeded: BulkVariantSuccess[] = [];
  const failed: BulkVariantFailure[] = [];

  results.forEach((result, index) => {
    const variantId = variantIds[index]!;
    if (result.status === 'fulfilled') {
      succeeded.push({ variantId });
      return;
    }
    const reason = result.reason;
    failed.push({
      variantId,
      error: reason instanceof Error ? reason.message : 'Request failed',
    });
  });

  return { succeeded, failed };
}

export function filterEligibleForSandbox(
  variants: ContentVariant[],
  selectedIds: string[]
): SandboxEligibility {
  const selected = variants.filter((variant) => selectedIds.includes(variant.id));
  const eligible = selected.filter((variant) => !variantInWorkbench(variant));
  return {
    eligible,
    skippedInWorkbench: selected.length - eligible.length,
  };
}

export function filterEligibleForMarkReady(
  variants: ContentVariant[],
  selectedIds: string[]
): MarkReadyEligibility {
  const selected = variants.filter((variant) => selectedIds.includes(variant.id));
  const skippedRejected = selected.filter((variant) => variant.status === 'rejected').length;
  const notRejected = selected.filter((variant) => variant.status !== 'rejected');
  const eligible = notRejected.filter((variant) => variant.distributionStatus !== 'READY');
  return {
    eligible,
    skippedRejected,
    skippedAlreadyReady: notRejected.length - eligible.length,
  };
}

export function filterEligibleForQueue(
  variants: ContentVariant[],
  selectedIds: string[]
): QueueEligibility {
  const selected = variants.filter((variant) => selectedIds.includes(variant.id));
  const skippedRejected = selected.filter((variant) => variant.status === 'rejected').length;
  const notRejected = selected.filter((variant) => variant.status !== 'rejected');
  const eligible = notRejected.filter((variant) => variant.distributionStatus !== 'SCHEDULED');
  return {
    eligible,
    skippedRejected,
    skippedAlreadyQueued: notRejected.length - eligible.length,
  };
}

export function filterEligibleForReject(
  variants: ContentVariant[],
  selectedIds: string[]
): RejectEligibility {
  const selected = variants.filter((variant) => selectedIds.includes(variant.id));
  const eligible = selected.filter((variant) => variant.status !== 'rejected');
  return {
    eligible,
    skippedAlreadyRejected: selected.length - eligible.length,
  };
}

export function buildBulkSandboxToastMessages(
  attempted: number,
  succeededCount: number,
  skippedInWorkbench: number
): { success?: { title: string; message?: string }; error?: { title: string } } {
  if (attempted === 0) {
    if (skippedInWorkbench > 0) {
      return {
        success: {
          title:
            skippedInWorkbench === 1
              ? 'Already in Workbench'
              : `${skippedInWorkbench} already in Workbench`,
        },
      };
    }
    return { error: { title: 'No variants to send' } };
  }

  const messages: { success?: { title: string; message?: string }; error?: { title: string } } = {};

  if (succeededCount === 0) {
    messages.error = { title: 'Failed to push variants to Workbench' };
    return messages;
  }

  if (succeededCount === attempted) {
    messages.success = {
      title:
        succeededCount === 1
          ? 'Pushed to Workbench'
          : `Pushed ${succeededCount} variants to Workbench`,
    };
  } else {
    messages.success = {
      title: `Pushed ${succeededCount} of ${attempted} to Workbench`,
    };
    messages.error = {
      title: `Failed to push ${attempted - succeededCount} variant${
        attempted - succeededCount === 1 ? '' : 's'
      }`,
    };
  }

  if (skippedInWorkbench > 0) {
    const skippedLabel =
      skippedInWorkbench === 1
        ? '1 already in Workbench'
        : `${skippedInWorkbench} already in Workbench`;
    messages.success = {
      title: messages.success?.title ?? 'Bulk push completed',
      message: messages.success?.message
        ? `${messages.success.message}; ${skippedLabel}`
        : skippedLabel,
    };
  }

  return messages;
}

export function buildBulkMarkReadyToastMessages(
  attempted: number,
  succeededCount: number,
  skippedRejected: number,
  skippedAlreadyReady: number
): { success?: { title: string; message?: string }; error?: { title: string } } {
  if (attempted === 0) {
    const skippedParts: string[] = [];
    if (skippedRejected > 0) {
      skippedParts.push(`${skippedRejected} rejected variant${skippedRejected === 1 ? '' : 's'}`);
    }
    if (skippedAlreadyReady > 0) {
      skippedParts.push(
        `${skippedAlreadyReady} already ready variant${skippedAlreadyReady === 1 ? '' : 's'}`
      );
    }
    if (skippedParts.length > 0) {
      return {
        success: {
          title: 'Nothing to mark ready',
          message: `Skipped ${skippedParts.join(' and ')}`,
        },
      };
    }
    return { error: { title: 'No variants to mark ready' } };
  }

  const messages: { success?: { title: string; message?: string }; error?: { title: string } } = {};

  if (succeededCount === 0) {
    messages.error = { title: 'Failed to mark variants ready' };
    return messages;
  }

  if (succeededCount === attempted) {
    messages.success = {
      title: succeededCount === 1 ? 'Marked ready' : `Marked ${succeededCount} variants ready`,
    };
  } else {
    messages.success = {
      title: `Marked ${succeededCount} of ${attempted} ready`,
    };
    messages.error = {
      title: `Failed to mark ${attempted - succeededCount} variant${
        attempted - succeededCount === 1 ? '' : 's'
      } ready`,
    };
  }

  const skippedParts: string[] = [];
  if (skippedRejected > 0) {
    skippedParts.push(`${skippedRejected} rejected`);
  }
  if (skippedAlreadyReady > 0) {
    skippedParts.push(`${skippedAlreadyReady} already ready`);
  }
  if (skippedParts.length > 0) {
    messages.success = {
      title: messages.success?.title ?? 'Bulk mark ready completed',
      message: `Skipped ${skippedParts.join(', ')}`,
    };
  }

  return messages;
}

export function buildBulkQueueToastMessages(
  attempted: number,
  succeededCount: number,
  skippedRejected: number,
  skippedAlreadyQueued: number
): { success?: { title: string; message?: string }; error?: { title: string } } {
  if (attempted === 0) {
    const skippedParts: string[] = [];
    if (skippedRejected > 0) {
      skippedParts.push(`${skippedRejected} rejected variant${skippedRejected === 1 ? '' : 's'}`);
    }
    if (skippedAlreadyQueued > 0) {
      skippedParts.push(
        `${skippedAlreadyQueued} already queued variant${skippedAlreadyQueued === 1 ? '' : 's'}`
      );
    }
    if (skippedParts.length > 0) {
      return {
        success: {
          title: 'Nothing to add to queue',
          message: `Skipped ${skippedParts.join(' and ')}`,
        },
      };
    }
    return { error: { title: 'No variants to add to queue' } };
  }

  const messages: { success?: { title: string; message?: string }; error?: { title: string } } = {};

  if (succeededCount === 0) {
    messages.error = { title: 'Failed to add variants to queue' };
    return messages;
  }

  if (succeededCount === attempted) {
    messages.success = {
      title:
        succeededCount === 1
          ? 'Added to publish queue'
          : `Added ${succeededCount} variants to queue`,
    };
  } else {
    messages.success = {
      title: `Added ${succeededCount} of ${attempted} to queue`,
    };
    messages.error = {
      title: `Failed to add ${attempted - succeededCount} variant${
        attempted - succeededCount === 1 ? '' : 's'
      } to queue`,
    };
  }

  const skippedParts: string[] = [];
  if (skippedRejected > 0) {
    skippedParts.push(`${skippedRejected} rejected`);
  }
  if (skippedAlreadyQueued > 0) {
    skippedParts.push(`${skippedAlreadyQueued} already queued`);
  }
  if (skippedParts.length > 0) {
    messages.success = {
      title: messages.success?.title ?? 'Bulk add to queue completed',
      message: `Skipped ${skippedParts.join(', ')}`,
    };
  }

  return messages;
}

export function buildBulkRejectToastMessages(
  attempted: number,
  succeededCount: number,
  skippedAlreadyRejected: number
): { success?: { title: string; message?: string }; error?: { title: string } } {
  if (attempted === 0) {
    if (skippedAlreadyRejected > 0) {
      return {
        success: {
          title:
            skippedAlreadyRejected === 1
              ? 'Already rejected'
              : `${skippedAlreadyRejected} already rejected`,
        },
      };
    }
    return { error: { title: 'No variants to reject' } };
  }

  const messages: { success?: { title: string; message?: string }; error?: { title: string } } = {};

  if (succeededCount === 0) {
    messages.error = { title: 'Failed to reject variants' };
    return messages;
  }

  if (succeededCount === attempted) {
    messages.success = {
      title: succeededCount === 1 ? 'Variant rejected' : `Rejected ${succeededCount} variants`,
    };
  } else {
    messages.success = {
      title: `Rejected ${succeededCount} of ${attempted}`,
    };
    messages.error = {
      title: `Failed to reject ${attempted - succeededCount} variant${
        attempted - succeededCount === 1 ? '' : 's'
      }`,
    };
  }

  if (skippedAlreadyRejected > 0) {
    const skippedLabel =
      skippedAlreadyRejected === 1
        ? '1 already rejected'
        : `${skippedAlreadyRejected} already rejected`;
    messages.success = {
      title: messages.success?.title ?? 'Bulk reject completed',
      message: messages.success?.message
        ? `${messages.success.message}; ${skippedLabel}`
        : skippedLabel,
    };
  }

  return messages;
}
