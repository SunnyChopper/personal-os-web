import { cn } from '@/lib/utils';
import type { ToolPhase } from '@/lib/tools/tool-nav';
import { TOOL_PHASE_LABELS } from '@/lib/tools/tool-nav';

interface ComingSoonPanelProps {
  title: string;
  phase: ToolPhase;
  description?: string;
  className?: string;
}

export default function ComingSoonPanel({
  title,
  phase,
  description,
  className,
}: ComingSoonPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-8 text-center dark:border-gray-600 dark:bg-gray-900/40',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description ?? 'This tool is wired in the navigation; implementation ships in a later phase.'}
      </p>
      <p className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
        {TOOL_PHASE_LABELS[phase]}
      </p>
    </div>
  );
}
