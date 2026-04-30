import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { Metric, MetricLog, CreateMetricLogInput } from '@/types/growth-system';
import { MetricLogForm } from './MetricLogForm';

interface MetricMobileLogFormProps {
  metric: Metric;
  logs: MetricLog[];
  onSubmit: (input: CreateMetricLogInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MetricMobileLogForm({
  metric,
  logs,
  onSubmit,
  onCancel,
  isLoading = false,
}: MetricMobileLogFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndY.current = null;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;

    const distance = touchStartY.current - touchEndY.current;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:hidden"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close form"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Log {metric.name}</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <MetricLogForm
            metric={metric}
            logs={logs}
            onSubmit={(input) => {
              onSubmit(input);
              setIsOpen(false);
            }}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
