import { cn } from '@/lib/utils';

export default function ToolsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-4 p-4', className)} aria-hidden>
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-64 rounded-lg bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}
