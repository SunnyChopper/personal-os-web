import { cn } from '@/lib/utils';

export default function AdminRouteSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-4 p-4 md:p-6', className)} aria-hidden>
      <div className="h-8 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}
