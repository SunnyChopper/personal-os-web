import StudyDashboard from '@/components/organisms/StudyDashboard';

export default function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Master your knowledge through spaced repetition
        </p>
      </div>

      <StudyDashboard />
    </div>
  );
}
