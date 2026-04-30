import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Calendar,
  TrendingUp,
  BookOpen,
  Play,
  Sparkles,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { spacedRepetitionService } from '@/services/knowledge-vault';
import { ROUTES } from '@/routes';
import type { Flashcard } from '@/types/knowledge-vault';

export default function StudyDashboard() {
  const navigate = useNavigate();
  const { flashcards } = useKnowledgeVault();

  const flashcardsWithData = flashcards.map((fc: Flashcard) => ({
    ...fc,
    spacedRepetitionData: {
      easinessFactor: fc.easeFactor,
      repetitionCount: fc.repetitions,
      intervalDays: fc.interval,
      nextReviewDate: fc.nextReviewDate,
      lastReviewDate: fc.lastAccessedAt,
      reviewHistory: [],
    },
  }));

  const stats = spacedRepetitionService.getStudyStats(flashcardsWithData);
  const dueCards = spacedRepetitionService.getDueFlashcards(flashcardsWithData);

  const getMotivationalMessage = () => {
    if (stats.dueCount === 0) {
      return "You're all caught up! Great work!";
    } else if (stats.dueCount <= 5) {
      return "Just a few cards left. You've got this!";
    } else if (stats.dueCount <= 20) {
      return 'Time for a quick review session!';
    } else {
      return "Let's tackle these reviews together!";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={32} />
          <h2 className="text-3xl font-bold">Daily Study Session</h2>
        </div>
        <p className="text-lg opacity-90 mb-6">{getMotivationalMessage()}</p>

        <div className="flex gap-3 flex-wrap">
          {stats.dueCount > 0 ? (
            <button
              onClick={() => navigate(`${ROUTES.admin.knowledgeVault}/study`)}
              className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold text-lg transition shadow-lg"
            >
              <Play size={24} />
              <span>Start Study Session ({stats.dueCount} cards)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-lg font-semibold">
              <Sparkles size={24} />
              <span>No cards due right now</span>
            </div>
          )}

          {flashcards.length > 0 && (
            <button
              onClick={() => navigate(`${ROUTES.admin.knowledgeVault}/study?mode=cram`)}
              className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg font-semibold transition"
            >
              <Zap size={20} />
              <span>Cram Mode ({flashcards.length} cards)</span>
            </button>
          )}

          <button
            onClick={() => navigate(`${ROUTES.admin.knowledgeVault}/statistics`)}
            className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg font-semibold transition"
          >
            <BarChart3 size={20} />
            <span>View Statistics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.dueToday}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Due Today</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Complete these to stay on track
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.dueTomorrow}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Due Tomorrow</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming review sessions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpen size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalCards}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Cards</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">In your collection</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Study Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalReviews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
          </div>

          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.averageEasinessFactor}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Ease Factor</div>
          </div>

          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalCards - stats.dueCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Learned</div>
          </div>

          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {stats.totalCards > 0
                ? Math.round(((stats.totalCards - stats.dueCount) / stats.totalCards) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</div>
          </div>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Up Next</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.min(5, dueCards.length)} of {dueCards.length}
            </span>
          </div>

          <div className="space-y-2">
            {dueCards.slice(0, 5).map((card: Flashcard) => (
              <div
                key={card.id}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {card.front}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Reviewed {card.repetitions} times
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    EF: {card.easeFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {dueCards.length > 5 && (
            <button
              onClick={() => navigate(`${ROUTES.admin.knowledgeVault}/study`)}
              className="w-full mt-4 py-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
            >
              View all {dueCards.length} cards →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
