import type { RadarFeedbackStats } from '@/types/api/personal-branding.dto';

export interface RadarLearningSignalBannerProps {
  stats: RadarFeedbackStats;
}

function formatWeekCount(count: number): string {
  return count === 1 ? '1 irrelevant signal this week' : `${count} irrelevant signals this week`;
}

export default function RadarLearningSignalBanner({ stats }: RadarLearningSignalBannerProps) {
  if (stats.irrelevantSignalsLast7Days <= 0) {
    return null;
  }

  const trainingNote =
    stats.trainingExampleCount > 0
      ? `Your reasons are training the ranking filter (up to ${stats.trainingExampleLimit} recent examples).`
      : `Your reasons train the ranking filter (up to ${stats.trainingExampleLimit} recent examples).`;

  return (
    <div
      className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100"
      role="status"
    >
      <p className="font-medium">{formatWeekCount(stats.irrelevantSignalsLast7Days)}</p>
      <p className="mt-1 text-sky-800 dark:text-sky-200/90">{trainingNote}</p>
    </div>
  );
}
