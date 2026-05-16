import { useState, type ReactNode } from 'react';

import { HelpCircle } from 'lucide-react';

interface HoverMetricHelpProps {
  children: ReactNode;
  ariaLabel?: string;
  /** Panel width; defaults to roomy card tooltips */
  panelClassName?: string;
}

/**
 * Hover help bubble for habit/analytics metric cards — matches legacy HabitStatCard pattern.
 */
export function HoverMetricHelp({
  children,
  ariaLabel = 'More information',
  panelClassName = 'w-72 max-w-[calc(100vw-2rem)]',
}: HoverMetricHelpProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex shrink-0">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={ariaLabel}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {showTooltip && (
        <div
          className={`absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 ${panelClassName} p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg text-left leading-snug`}
        >
          {children}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}
