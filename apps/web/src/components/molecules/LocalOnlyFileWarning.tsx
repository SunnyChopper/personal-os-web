import { AlertTriangle } from 'lucide-react';

interface LocalOnlyFileWarningProps {
  fileName: string;
}

export default function LocalOnlyFileWarning({ fileName }: LocalOnlyFileWarningProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span>
          This file (<strong>{fileName}</strong>) is saved locally. Save or rename to persist to
          server.
        </span>
      </div>
    </div>
  );
}
