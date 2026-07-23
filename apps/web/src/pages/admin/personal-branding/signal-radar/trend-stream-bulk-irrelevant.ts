import type { RadarItem } from '@/types/api/personal-branding.dto';

export interface BulkIrrelevantSuccess {
  itemId: string;
  updatedItem: RadarItem;
}

export interface BulkIrrelevantFailure {
  itemId: string;
  error: string;
}

export interface BulkIrrelevantOutcome {
  succeeded: BulkIrrelevantSuccess[];
  failed: BulkIrrelevantFailure[];
}

export function partitionBulkIrrelevantResults(
  itemIds: string[],
  results: PromiseSettledResult<RadarItem>[]
): BulkIrrelevantOutcome {
  const succeeded: BulkIrrelevantSuccess[] = [];
  const failed: BulkIrrelevantFailure[] = [];

  results.forEach((result, index) => {
    const itemId = itemIds[index]!;
    if (result.status === 'fulfilled') {
      succeeded.push({ itemId, updatedItem: result.value });
      return;
    }
    const reason = result.reason;
    failed.push({
      itemId,
      error: reason instanceof Error ? reason.message : 'Failed to update relevance',
    });
  });

  return { succeeded, failed };
}

export function buildBulkIrrelevantToastMessages(
  total: number,
  succeededCount: number
): { success?: { title: string }; error?: { title: string } } {
  if (succeededCount === 0) {
    return { error: { title: 'Failed to mark cards as irrelevant' } };
  }
  if (succeededCount === total) {
    return {
      success: {
        title: total === 1 ? 'Marked as irrelevant' : `Marked ${succeededCount} as irrelevant`,
      },
    };
  }
  const failedCount = total - succeededCount;
  return {
    success: { title: `Marked ${succeededCount} of ${total} as irrelevant` },
    error: {
      title: `Failed to update ${failedCount} card${failedCount === 1 ? '' : 's'}`,
    },
  };
}
