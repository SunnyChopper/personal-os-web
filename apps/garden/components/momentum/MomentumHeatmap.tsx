"use client";

import type { MomentumDay } from "@/lib/queries/public-momentum";

function intensityClass(n: number): string {
  if (n <= 0) return "bg-gray-100";
  if (n < 2) return "bg-blue-200";
  if (n < 4) return "bg-blue-400";
  return "bg-blue-600";
}

export function MomentumHeatmap({ days }: { days: MomentumDay[] }) {
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  const last30 = sorted.slice(-30);
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {last30.map((d) => {
          const total = d.habitCompletions + Math.min(d.storyPointsCompleted, 8);
          return (
            <div
              key={d.day}
              title={`${d.day}: habits ${d.habitCompletions}, pts ${d.storyPointsCompleted}`}
              className={`h-10 w-3 rounded-sm ${intensityClass(total)}`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Intensity blends habit completions and capped story points (last 30 days with data).
      </p>
    </div>
  );
}
