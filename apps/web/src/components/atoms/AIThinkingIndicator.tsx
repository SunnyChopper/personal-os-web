interface AIThinkingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { dot: 'w-1.5 h-1.5', text: 'text-xs', gap: 'gap-1' },
  md: { dot: 'w-2 h-2', text: 'text-sm', gap: 'gap-1.5' },
  lg: { dot: 'w-2.5 h-2.5', text: 'text-base', gap: 'gap-2' },
};

export function AIThinkingIndicator({
  message = 'AI is thinking...',
  size = 'md',
  className = '',
}: AIThinkingIndicatorProps) {
  const config = sizeConfig[size];

  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      <div className="flex items-center gap-1">
        <span
          className={`${config.dot} rounded-full bg-purple-500 animate-bounce`}
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className={`${config.dot} rounded-full bg-purple-500 animate-bounce`}
          style={{ animationDelay: '200ms', animationDuration: '1s' }}
        />
        <span
          className={`${config.dot} rounded-full bg-purple-500 animate-bounce`}
          style={{ animationDelay: '400ms', animationDuration: '1s' }}
        />
      </div>
      <span className={`${config.text} text-gray-600 dark:text-gray-400 font-medium`}>
        {message}
      </span>
    </div>
  );
}
