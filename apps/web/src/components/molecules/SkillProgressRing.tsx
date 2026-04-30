export interface SkillProgressRingProps {
  /** 0–100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Circular progress indicator for skill completion. */
export function SkillProgressRing({
  progress,
  size = 44,
  strokeWidth = 3,
  className = '',
}: SkillProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, progress));
  const offset = c - (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden
      data-testid="skill-progress-ring"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-gray-200 dark:stroke-gray-600"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-green-500 dark:stroke-green-400 transition-[stroke-dashoffset] duration-300"
        strokeWidth={strokeWidth}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
