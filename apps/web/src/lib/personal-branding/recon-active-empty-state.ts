import type { EmptyStateSceneId } from '@/components/molecules/EmptyState';

export type ReconAgePreset = 'all' | '1d' | '2d' | '3d' | '7d' | '2wk';

export type ReconActiveEmptyKind = 'scarcity' | 'awaitingIngest' | 'filtered' | 'caughtUp';

export const RECON_AGE_PRESET_LABELS: Record<ReconAgePreset, string> = {
  all: 'All',
  '1d': '1d',
  '2d': '2d',
  '3d': '3d',
  '7d': '7d',
  '2wk': '2wk',
};

export function resolveReconActiveEmptyKind(input: {
  trackedXHandleCount: number;
  showScarcityHint: boolean;
  lastRunAt?: string | null;
  agePreset: ReconAgePreset;
}): ReconActiveEmptyKind {
  const hasTrackedXHandles = input.trackedXHandleCount > 0;

  if (!hasTrackedXHandles || input.showScarcityHint) {
    return 'scarcity';
  }

  if (!input.lastRunAt) {
    return 'awaitingIngest';
  }

  if (input.agePreset !== 'all') {
    return 'filtered';
  }

  return 'caughtUp';
}

export type ReconActiveEmptyPresentation = {
  kind: ReconActiveEmptyKind;
  scene: EmptyStateSceneId;
  title: string;
  description: string;
  actionLabel: string;
};

export function buildReconActiveEmptyPresentation(input: {
  kind: ReconActiveEmptyKind;
  hasTrackedXHandles: boolean;
  scarcityMessage?: string | null;
  agePreset: ReconAgePreset;
  processedCount?: number;
}): ReconActiveEmptyPresentation {
  const { kind, hasTrackedXHandles, scarcityMessage, agePreset, processedCount = 0 } = input;

  if (kind === 'scarcity') {
    if (!hasTrackedXHandles) {
      return {
        kind,
        scene: 'reconScarcity',
        title: 'Add X handles to start recon',
        description:
          'Track creators in Connection Directory so ingest can pull and score their posts.',
        actionLabel: 'Add X handles in Connection Directory',
      };
    }

    return {
      kind,
      scene: 'reconScarcity',
      title: 'Few high-signal posts lately',
      description:
        scarcityMessage ?? 'Consider adding more high-signal accounts in Connection Directory.',
      actionLabel: 'Open Connection Directory',
    };
  }

  if (kind === 'awaitingIngest') {
    return {
      kind,
      scene: 'reconAwaitingIngest',
      title: 'Ready for your first ingest',
      description:
        'Tracked X handles are set up. Run ingest to pull and score posts for the Active feed.',
      actionLabel: 'Run now',
    };
  }

  if (kind === 'filtered') {
    const ageLabel = RECON_AGE_PRESET_LABELS[agePreset];
    return {
      kind,
      scene: 'filteredEmpty',
      title: 'No posts in this age window',
      description: `Nothing new matches the ${ageLabel} filter. Show all ages to see the full Active feed.`,
      actionLabel: 'Show all ages',
    };
  }

  return {
    kind,
    scene: 'reconAwaitingIngest',
    title: 'No new posts to review',
    description:
      processedCount > 0
        ? 'You cleared the Active queue. Expand Processed below or run ingest for fresh items.'
        : 'Run ingest to pull the latest posts from your tracked accounts.',
    actionLabel: 'Run now',
  };
}
