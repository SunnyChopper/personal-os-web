import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  Brain,
  Clock,
  Award,
  BarChart3,
} from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { spacedRepetitionService } from '@/services/knowledge-vault';
import { ROUTES } from '@/routes';
import type { Flashcard } from '@/types/knowledge-vault';

export default function StudyStatisticsPage() {
  const navigate = useNavigate();
  const { flashcards } = useKnowledgeVault();

  const flashcardsWithData = useMemo(() => {
    return flashcards.map((fc: Flashcard) => ({
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
  }, [flashcards]);

  const stats = spacedRepetitionService.getStudyStats(flashcardsWithData);

  const masteryDistribution = useMemo(() => {
    const distribution = {
      learning: 0,
      young: 0,
      mature: 0,
      mastered: 0,
    };

    flashcards.forEach((card: Flashcard) => {
      if (card.repetitions === 0) {
        distribution.learning++;
      } else if (card.interval < 21) {
        distribution.young++;
      } else if (card.interval < 100) {
        distribution.mature++;
      } else {
        distribution.mastered++;
      }
    });

    return distribution;
  }, [flashcards]);

  const avgInterval = useMemo(() => {
    if (flashcards.length === 0) return 0;
    const total = flashcards.reduce((sum: number, card: Flashcard) => sum + card.interval, 0);
    return Math.round(total / flashcards.length);
  }, [flashcards]);

  const totalReviewTime = useMemo(() => {
    const avgTimePerCard = 30;
    return Math.round((stats.totalReviews * avgTimePerCard) / 60);
  }, [stats.totalReviews]);

  const upcomingReviews = useMemo(() => {
    const next7Days = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toDateString();

      const count = flashcards.filter((card: Flashcard) => {
        const reviewDate = new Date(card.nextReviewDate);
        return reviewDate.toDateString() === dateStr;
      }).length;

      next7Days.push({
        date: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        count,
      });
    }

    return next7Days;
  }, [flashcards]);

  const retentionRate = useMemo(() => {
    if (stats.totalCards === 0) return 100;
    return Math.round(((stats.totalCards - stats.dueCount) / stats.totalCards) * 100);
  }, [stats.totalCards, stats.dueCount]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(ROUTES.admin.knowledgeVault)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Knowledge Vault</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Statistics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your learning progress and retention
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Brain size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalCards}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Cards</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.dueCount} due for review
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {retentionRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.totalCards - stats.dueCount} cards retained
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Lifetime study sessions</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalReviewTime}m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Study Time</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Estimated total time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Card Mastery Distribution
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Learning
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {masteryDistribution.learning} cards
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(masteryDistribution.learning / stats.totalCards) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                New cards, learning phase
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Young</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {masteryDistribution.young} cards
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${(masteryDistribution.young / stats.totalCards) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Interval less than 3 weeks
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mature</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {masteryDistribution.mature} cards
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(masteryDistribution.mature / stats.totalCards) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3 weeks to 100 days interval
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mastered
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {masteryDistribution.mastered} cards
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(masteryDistribution.mastered / stats.totalCards) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Over 100 days interval
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Reviews (Next 7 Days)
            </h2>
          </div>

          <div className="space-y-3">
            {upcomingReviews.map((day, index) => (
              <div
                key={day.date}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <div className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                      TODAY
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {day.date}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Average Interval
            </h3>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {avgInterval} days
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average time between reviews</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ease Factor</h3>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.averageEasinessFactor}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average card difficulty (2.5 baseline)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reviews Per Card
            </h3>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.totalCards > 0 ? (stats.totalReviews / stats.totalCards).toFixed(1) : 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average review count per card</p>
        </div>
      </div>
    </div>
  );
}
