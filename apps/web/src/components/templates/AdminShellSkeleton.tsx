import AdminRouteSkeleton from '@/components/molecules/AdminRouteSkeleton';

/** Fixed overlay mirroring AdminLayout chrome while auth/bootstrap completes. */
export default function AdminShellSkeleton() {
  return (
    <div
      className="fixed inset-0 z-[9998] flex min-h-screen bg-gray-50 dark:bg-gray-900"
      aria-hidden
    >
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:block">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-36 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-44 rounded bg-gray-100 dark:bg-gray-700/80" />
          <div className="mt-6 h-9 w-full rounded-lg bg-gray-100 dark:bg-gray-700" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-700/70" />
            ))}
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 lg:hidden">
          <div className="animate-pulse h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <main className="flex-1 overflow-auto">
          <AdminRouteSkeleton />
        </main>
      </div>
    </div>
  );
}
