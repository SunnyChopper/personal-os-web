interface ProgressRingProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 40, fontSize: 'text-xs' },
  md: { dimension: 64, fontSize: 'text-sm' },
  lg: { dimension: 96, fontSize: 'text-base' },
  xl: { dimension: 128, fontSize: 'text-lg' },
};

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
};

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 4,
  showLabel = true,
  color = 'blue',
  className = '',
}: ProgressRingProps) {
  const { dimension, fontSize } = sizeConfig[size];
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={dimension} height={dimension} className="transform -rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${colorClasses[color]}`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold ${fontSize} ${colorClasses[color]}`}>
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
}
