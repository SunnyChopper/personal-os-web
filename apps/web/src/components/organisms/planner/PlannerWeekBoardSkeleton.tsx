const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-white/10 ${className}`} />;
}

function PlannerBlockCardSkeleton({ showActions = false }: { showActions?: boolean }) {
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-gray-900/40 p-3">
      <SkeletonBar className="h-2.5 w-16" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-4/5" />
      <SkeletonBar className="h-2.5 w-24" />
      {showActions ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <SkeletonBar className="h-7 w-full rounded-md" />
          <SkeletonBar className="h-7 w-full rounded-md" />
        </div>
      ) : null}
    </div>
  );
}

function PlannerDayColumnSkeleton({
  weekday,
  cardCount,
  showActions,
  highlightToday,
}: {
  weekday: string;
  cardCount: number;
  showActions?: boolean;
  highlightToday?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[200px] w-full min-w-[120px] flex-1 flex-col rounded-xl border-2 border-white/10 bg-gray-900/40 p-2 lg:min-w-0 ${
        highlightToday ? 'ring-1 ring-white/20' : ''
      }`}
      aria-hidden
    >
      <div className="mb-2 space-y-1.5 text-center">
        <SkeletonBar className="mx-auto h-2.5 w-8" />
        <SkeletonBar className="mx-auto h-4 w-10" />
        {highlightToday ? <SkeletonBar className="mx-auto h-3 w-12 rounded-full" /> : null}
      </div>

      <div className="mb-2 space-y-1">
        <div className="flex justify-between gap-2">
          <SkeletonBar className="h-2.5 w-16" />
          <SkeletonBar className="h-2.5 w-14" />
        </div>
        <SkeletonBar className="h-2 w-full rounded-full" />
      </div>

      <div className="flex min-h-[120px] flex-1 flex-col gap-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <PlannerBlockCardSkeleton key={`${weekday}-card-${index}`} showActions={showActions} />
        ))}
      </div>
    </div>
  );
}

const COLUMN_LAYOUT = [
  { cardCount: 0, showActions: false },
  { cardCount: 1, showActions: false },
  { cardCount: 1, showActions: true },
  { cardCount: 2, showActions: true, highlightToday: true },
  { cardCount: 1, showActions: false },
  { cardCount: 0, showActions: false },
  { cardCount: 0, showActions: false },
] as const;

/**
 * Loading placeholder that mirrors the week board wrapper and 7-column day grid.
 */
export function PlannerWeekBoardSkeleton() {
  return (
    <div
      className="w-full animate-pulse rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/50 to-gray-950/80 p-3 shadow-inner"
      role="status"
      aria-label="Loading week board"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible">
        {WEEKDAY_LABELS.map((weekday, index) => {
          const layout = COLUMN_LAYOUT[index];
          return (
            <PlannerDayColumnSkeleton
              key={weekday}
              weekday={weekday}
              cardCount={layout.cardCount}
              showActions={layout.showActions}
              highlightToday={'highlightToday' in layout ? layout.highlightToday : false}
            />
          );
        })}
      </div>
    </div>
  );
}
