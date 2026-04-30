interface AIConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { bar: 'h-1', text: 'text-xs', width: 'w-16' },
  md: { bar: 'h-1.5', text: 'text-sm', width: 'w-24' },
  lg: { bar: 'h-2', text: 'text-base', width: 'w-32' },
};

export function AIConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = true,
  className = '',
}: AIConfidenceIndicatorProps) {
  const normalizedConfidence = Math.min(Math.max(confidence, 0), 100);
  const config = sizeConfig[size];

  const getColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 60) return 'bg-blue-500';
    if (conf >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const colorClass = getColor(normalizedConfidence);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`${config.text} text-gray-600 dark:text-gray-400 font-medium`}>
          {normalizedConfidence}%
        </span>
      )}
      <div
        className={`${config.width} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${config.bar}`}
      >
        <div
          className={`${config.bar} ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${normalizedConfidence}%` }}
        />
      </div>
    </div>
  );
}
