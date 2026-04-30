"use client";

import type { MomentumDay } from "@/lib/queries/public-momentum";

export function VelocityChart({ days }: { days: MomentumDay[] }) {
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  const last = sorted.slice(-14);
  const maxPts = Math.max(1, ...last.map((d) => d.storyPointsCompleted));
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700">Story points (14d)</h3>
      <div className="mt-2 flex h-28 items-end gap-1">
        {last.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-blue-500/80"
              style={{ height: `${(d.storyPointsCompleted / maxPts) * 100}%`, minHeight: "4px" }}
              title={`${d.day}: ${d.storyPointsCompleted} pts`}
            />
            <span className="rotate-45 text-[8px] text-gray-500">{d.day.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
