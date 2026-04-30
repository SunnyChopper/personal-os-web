import { Film, Tv, Book, Music } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';

export default function MediaBacklogPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Media Backlog</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track movies, TV shows, books, and music you want to enjoy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movies</h3>
            <Film className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In backlog</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TV Shows</h3>
            <Tv className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In backlog</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Books</h3>
            <Book className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In backlog</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Music</h3>
            <Music className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In backlog</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <EmptyState
          icon={Film}
          title="No media in your backlog"
          description="Start adding movies, TV shows, books, and music you want to enjoy during your leisure time."
          actionLabel="Add Media"
          onAction={() => {}}
        />
      </div>
    </div>
  );
}
