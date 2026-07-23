import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '@/hooks/use-toast';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const accentStyles = {
  success:
    'border-l-green-500 bg-green-50/95 text-green-900 dark:bg-green-950/90 dark:text-green-100',
  error: 'border-l-red-500 bg-red-50/95 text-red-900 dark:bg-red-950/90 dark:text-red-100',
  warning:
    'border-l-amber-500 bg-amber-50/95 text-amber-900 dark:bg-amber-950/90 dark:text-amber-100',
  info: 'border-l-blue-500 bg-blue-50/95 text-blue-900 dark:bg-blue-950/90 dark:text-blue-100',
};

const iconStyles = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex items-start gap-3 border border-l-4 p-4 rounded-2xl shadow-lg backdrop-blur-sm ${
        toast.type === 'error' ? 'max-w-xl' : 'max-w-sm'
      } ${accentStyles[toast.type]}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 dark:bg-black/20 ${iconStyles[toast.type]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        {toast.message && (
          <p
            className={`mt-1 ${
              toast.type === 'error'
                ? 'text-xs font-mono whitespace-pre-wrap break-words opacity-90'
                : 'text-xs leading-relaxed opacity-85'
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 opacity-70" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={() => onDismiss(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
