interface StartupLoaderProps {
  isLoading: boolean;
}

/** Lightweight CSS-only bootstrap loader (no framer-motion on critical path). */
export default function StartupLoader({ isLoading }: StartupLoaderProps) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-900"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 dark:border-t-blue-400 dark:border-r-purple-400" />
        <div
          className="absolute inset-3 animate-spin rounded-full border-[3px] border-transparent border-b-pink-500 border-l-purple-600 dark:border-b-pink-400 dark:border-l-purple-400"
          style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
        />
        <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400" />
      </div>
    </div>
  );
}
