import { useState } from 'react';
import { X, BookOpen, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Goal } from '@/types/growth-system';
import Button from '@/components/atoms/Button';

type ReviewType = 'weekly' | 'monthly' | 'quarterly';

interface GoalReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  reviewType: ReviewType;
  goals: Goal[];
  onSaveReview?: (review: GoalReview) => void;
}

interface GoalReview {
  type: ReviewType;
  date: string;
  goalsReviewed: string[];
  wins: string[];
  challenges: string[];
  adjustments: string[];
  nextFocus: string;
}

export function GoalReviewPrompt({
  isOpen,
  onClose,
  reviewType,
  goals,
  onSaveReview,
}: GoalReviewPromptProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [nextFocus, setNextFocus] = useState('');

  const getReviewTitle = () => {
    switch (reviewType) {
      case 'weekly':
        return 'Weekly Goal Review';
      case 'monthly':
        return 'Monthly Goal Health Check';
      case 'quarterly':
        return 'Quarterly Goal Review';
    }
  };

  const getReviewPrompts = () => {
    switch (reviewType) {
      case 'weekly':
        return {
          wins: 'What progress did you make this week?',
          challenges: 'What obstacles did you face?',
          adjustments: 'Do any goals need adjustment?',
          nextFocus: 'What will you focus on next week?',
        };
      case 'monthly':
        return {
          wins: 'What were your biggest wins this month?',
          challenges: 'What challenges emerged?',
          adjustments: 'Which goals need to be reprioritized?',
          nextFocus: 'What are your priorities for next month?',
        };
      case 'quarterly':
        return {
          wins: 'What major milestones did you achieve?',
          challenges: 'What strategic challenges arose?',
          adjustments: 'Should any goals be pivoted or abandoned?',
          nextFocus: 'What is your focus for the next quarter?',
        };
    }
  };

  const prompts = getReviewPrompts();
  const activeGoals = goals.filter(
    (g) => g.status === 'Active' || g.status === 'On Track' || g.status === 'At Risk'
  );

  const handleSubmit = () => {
    const review: GoalReview = {
      type: reviewType,
      date: new Date().toISOString(),
      goalsReviewed: selectedGoals,
      wins: wins.split('\n').filter((w) => w.trim()),
      challenges: challenges.split('\n').filter((c) => c.trim()),
      adjustments: adjustments.split('\n').filter((a) => a.trim()),
      nextFocus,
    };

    onSaveReview?.(review);
    onClose();
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getReviewTitle()}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reflect on your progress and plan ahead
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Goals Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select goals to review ({selectedGoals.length} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {activeGoals.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2 text-center py-4">
                    No active goals to review
                  </p>
                ) : (
                  activeGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedGoals.includes(goal.id)
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedGoals.includes(goal.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedGoals.includes(goal.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {goal.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {goal.timeHorizon} • {goal.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Reflection Questions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {prompts.wins}
                </label>
                <textarea
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  rows={3}
                  placeholder="List your wins (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {prompts.challenges}
                </label>
                <textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={3}
                  placeholder="Note any challenges (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {prompts.adjustments}
                </label>
                <textarea
                  value={adjustments}
                  onChange={(e) => setAdjustments(e.target.value)}
                  rows={2}
                  placeholder="Any adjustments needed?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {prompts.nextFocus}
                </label>
                <textarea
                  value={nextFocus}
                  onChange={(e) => setNextFocus(e.target.value)}
                  rows={2}
                  placeholder="Your focus for the next period..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Save to Logbook
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    This review will be saved to your logbook and linked to the selected goals for
                    future reference.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Skip for Now
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={selectedGoals.length === 0}>
              Save Review
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
