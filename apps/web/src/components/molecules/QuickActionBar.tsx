import { X, Trash2, Archive, Check } from 'lucide-react';

interface QuickActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: Array<{
    label: string;
    icon?: 'delete' | 'archive' | 'complete';
    variant?: 'danger' | 'success' | 'primary';
    onClick: () => void;
  }>;
  className?: string;
}

const iconMap = {
  delete: Trash2,
  archive: Archive,
  complete: Check,
};

export function QuickActionBar({
  selectedCount,
  onClear,
  actions,
  className = '',
}: QuickActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      style={{ animation: 'slideUp 0.2s ease-out' }}
    >
      <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} selected</span>
          <button
            onClick={onClear}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon ? iconMap[action.icon] : null;
            const variantClass =
              action.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : action.variant === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white';

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${variantClass}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
