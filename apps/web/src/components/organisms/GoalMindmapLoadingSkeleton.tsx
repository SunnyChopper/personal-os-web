const NODE_W = 'w-[260px]';

function MindmapSkeletonNode({ isRoot = false }: { isRoot?: boolean }) {
  return (
    <div
      className={`${NODE_W} shrink-0 rounded-lg border-2 bg-white p-3 shadow-sm dark:bg-gray-800 ${
        isRoot
          ? 'border-blue-300 ring-2 ring-blue-400/25 dark:border-blue-600 dark:ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 shrink-0 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
            <div className="h-4 flex-1 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-14 rounded-full bg-gray-200 animate-pulse dark:bg-gray-700" />
            <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse dark:bg-gray-700" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="h-10 w-10 shrink-0 rounded-full border-2 border-gray-200 bg-gray-100 animate-pulse dark:border-gray-600 dark:bg-gray-700/50" />
          <div className="h-2.5 w-8 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

/** Loading placeholder that mirrors GoalMindmapView: focus row, dotted canvas, LR tree, mini-map. */
export function GoalMindmapLoadingSkeleton() {
  return (
    <div
      className="flex min-h-[560px] flex-col gap-3"
      aria-busy="true"
      aria-label="Loading goals mind map"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Focus goal</span>
        <div
          className="min-h-[44px] min-w-[200px] rounded-lg border border-gray-300 bg-gray-100 animate-pulse dark:border-gray-600 dark:bg-gray-700/80"
          aria-hidden
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Pan and zoom the canvas. Click a node to open details.
        </span>
      </div>

      <div className="relative h-[min(70vh,720px)] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[length:16px_16px] bg-[radial-gradient(circle,rgb(148_163_184/0.35)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgb(100_116_139/0.45)_1px,transparent_1px)]"
          aria-hidden
        />
        <div
          className="absolute bottom-3 right-3 z-10 h-[104px] w-[148px] rounded-md border border-gray-200 bg-white/90 shadow-sm backdrop-blur-[2px] dark:border-gray-600 dark:bg-gray-800/90"
          aria-hidden
        >
          <div className="h-full w-full p-2">
            <div className="h-full rounded bg-gray-100 animate-pulse dark:bg-gray-700/50" />
          </div>
        </div>

        <div className="relative z-[1] flex min-h-full min-w-0 items-start gap-2 overflow-x-auto p-6 md:p-10 md:pl-12">
          <MindmapSkeletonNode isRoot />

          <div className="hidden shrink-0 pt-[58px] sm:block" aria-hidden>
            <div className="h-0 w-10 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
          </div>

          <div className="relative flex shrink-0 flex-col gap-10">
            <div
              className="pointer-events-none absolute -left-3 top-[58px] hidden h-[calc(100%-116px)] w-0 border-l-2 border-dashed border-gray-300 dark:border-gray-600 sm:block"
              aria-hidden
            />

            <div className="relative flex items-start gap-0 sm:gap-0">
              <div className="hidden w-6 shrink-0 pt-[58px] sm:block" aria-hidden>
                <div className="h-0 w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
              </div>
              <MindmapSkeletonNode />
            </div>

            <div className="relative flex items-start gap-0 sm:gap-0">
              <div className="hidden w-6 shrink-0 pt-[58px] sm:block" aria-hidden>
                <div className="h-0 w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
              </div>
              <MindmapSkeletonNode />
            </div>

            <div className="relative flex flex-col gap-10 sm:flex-row sm:items-start">
              <div className="flex items-start gap-0">
                <div className="hidden w-6 shrink-0 pt-[58px] sm:block" aria-hidden>
                  <div className="h-0 w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                </div>
                <MindmapSkeletonNode />
              </div>

              <div className="hidden shrink-0 pt-[58px] md:block" aria-hidden>
                <div className="h-0 w-8 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
              </div>

              <div className="relative flex flex-col gap-10 pl-4 sm:pl-0">
                <div
                  className="pointer-events-none absolute left-0 top-[58px] hidden h-[calc(100%-116px)] w-0 border-l-2 border-dashed border-gray-300 dark:border-gray-600 md:block"
                  aria-hidden
                />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative flex items-start gap-0">
                    <div className="hidden w-5 shrink-0 pt-[58px] md:block" aria-hidden>
                      <div className="h-0 w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                    </div>
                    <MindmapSkeletonNode />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
