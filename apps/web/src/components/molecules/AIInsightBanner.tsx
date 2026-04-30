import { Sparkles, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface AIInsightBannerProps {
  title: string;
  content: string;
  severity?: 'info' | 'warning' | 'critical';
  onDismiss?: () => void;
  className?: string;
}

const severityConfig = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-900 dark:text-blue-100',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: AlertTriangle,
    iconBg: 'bg-orange-500',
    textColor: 'text-orange-900 dark:text-orange-100',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconBg: 'bg-red-500',
    textColor: 'text-red-900 dark:text-red-100',
  },
};

export function AIInsightBanner({
  title,
  content,
  severity = 'info',
  onDismiss,
  className = '',
}: AIInsightBannerProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 ${className}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`font-semibold ${config.textColor} flex items-center gap-2 mb-1`}>
                <Icon className="w-4 h-4" />
                {title}
              </div>
              <div className={`text-sm ${config.textColor} opacity-90`}>{content}</div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors ${config.textColor}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
