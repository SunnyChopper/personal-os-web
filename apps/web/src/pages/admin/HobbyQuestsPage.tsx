import { Palette, Gamepad, Camera, Music, Star } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';

export default function HobbyQuestsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hobby Quests</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personal projects and hobbies you want to explore and master
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Creative</h3>
            <Palette className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active quests</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gaming</h3>
            <Gamepad className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active quests</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Photography</h3>
            <Camera className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active quests</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Music</h3>
            <Music className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active quests</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <EmptyState
          icon={Star}
          title="No hobby quests yet"
          description="Create quests for hobbies and personal interests you want to pursue during your leisure time."
          actionLabel="Create Quest"
          onAction={() => {}}
        />
      </div>
    </div>
  );
}
