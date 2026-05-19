/** Rolling average helpers for weekly velocity charts. */

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Client-side fallback when API omits rollingAverageStoryPoints. */
export function computeRollingAverages(pointsOldestFirst: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < pointsOldestFirst.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = pointsOldestFirst.slice(start, i + 1);
    out.push(mean(slice));
  }
  return out;
}
