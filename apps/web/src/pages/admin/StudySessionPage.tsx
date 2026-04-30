import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';
import { aiFlashcardGeneratorService, spacedRepetitionService } from '@/services/knowledge-vault';
import type { Flashcard } from '@/types/knowledge-vault';
import { ROUTES } from '@/routes';

type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export default function StudySessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cramMode = searchParams.get('mode') === 'cram';

  const { flashcards: allFlashcards, loading, refreshVaultItems } = useKnowledgeVault();
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });

  useEffect(() => {
    if (allFlashcards.length > 0) {
      const flashcardsWithData = allFlashcards.map((fc: Flashcard) => ({
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

      const cards = cramMode
        ? flashcardsWithData
        : spacedRepetitionService.getDueFlashcards(flashcardsWithData);

      setDueFlashcards(cards as Flashcard[]);

      if (cards.length === 0) {
        setSessionComplete(true);
      }
    }
  }, [allFlashcards, cramMode]);

  const currentCard = dueFlashcards[currentIndex];

  const handleReview = useCallback(
    async (quality: ReviewQuality) => {
      if (!currentCard || reviewing) return;

      setReviewing(true);

      try {
        await aiFlashcardGeneratorService.reviewFlashcard(currentCard.id, quality);

        setStats((prev) => ({
          correct: prev.correct + (quality >= 3 ? 1 : 0),
          incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
          total: prev.total + 1,
        }));

        if (currentIndex + 1 >= dueFlashcards.length) {
          setSessionComplete(true);
          await refreshVaultItems();
        } else {
          setCurrentIndex((prev) => prev + 1);
          setShowAnswer(false);
        }
      } catch (error) {
        console.error('Error reviewing flashcard:', error);
      } finally {
        setReviewing(false);
      }
    },
    [currentCard, reviewing, currentIndex, dueFlashcards.length, refreshVaultItems]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (reviewing || sessionComplete) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!showAnswer) {
          setShowAnswer(true);
        }
        return;
      }

      if (showAnswer) {
        const keyMap: Record<string, ReviewQuality> = {
          '1': 0,
          '2': 2,
          '3': 3,
          '4': 5,
        };

        if (keyMap[e.key] !== undefined) {
          e.preventDefault();
          handleReview(keyMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, reviewing, sessionComplete, handleReview]);

  const handleReset = async () => {
    await refreshVaultItems();
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setStats({ correct: 0, incorrect: 0, total: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (sessionComplete || dueFlashcards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(ROUTES.admin.knowledgeVault)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Knowledge Vault</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {stats.total > 0 ? 'Study Session Complete!' : 'No Cards Due'}
          </h2>

          {stats.total > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reviewed</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats.correct}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {stats.incorrect}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Needs Review</div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Accuracy: {Math.round((stats.correct / stats.total) * 100)}%
              </p>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {cramMode
                ? 'No flashcards available to study.'
                : "Great job! You're all caught up. Come back later for your next review session."}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              <RotateCcw size={20} />
              <span>Review Again</span>
            </button>
            <button
              onClick={() => navigate(ROUTES.admin.knowledgeVault)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(ROUTES.admin.knowledgeVault)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4">
          {cramMode && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-full">
              Cram Mode
            </span>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Card {currentIndex + 1} of {dueFlashcards.length}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentIndex / dueFlashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {currentCard && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="min-h-[400px] flex items-center justify-center p-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition"
            onClick={() => setShowAnswer(!showAnswer)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowAnswer(!showAnswer);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={showAnswer ? 'Hide answer' : 'Show answer'}
          >
            <div className="text-center w-full">
              {!showAnswer ? (
                <>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
                    Question
                  </div>
                  <p className="text-2xl font-medium text-gray-900 dark:text-white leading-relaxed">
                    {currentCard.front}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Press{' '}
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> to
                    reveal
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm text-green-600 dark:text-green-400 mb-4 uppercase tracking-wide">
                    Answer
                  </div>
                  <div className="text-xl text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {currentCard.back}
                  </div>
                </>
              )}
            </div>
          </div>

          {showAnswer && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                How well did you know this?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReview(0)}
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg transition disabled:opacity-50"
                >
                  <XCircle size={20} />
                  <div className="text-left">
                    <div className="font-semibold">
                      Forgot{' '}
                      <kbd className="ml-1 px-1.5 py-0.5 bg-red-200 dark:bg-red-900 rounded text-xs">
                        1
                      </kbd>
                    </div>
                    <div className="text-xs opacity-75">Complete blackout</div>
                  </div>
                </button>

                <button
                  onClick={() => handleReview(2)}
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg transition disabled:opacity-50"
                >
                  <RotateCcw size={20} />
                  <div className="text-left">
                    <div className="font-semibold">
                      Hard{' '}
                      <kbd className="ml-1 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900 rounded text-xs">
                        2
                      </kbd>
                    </div>
                    <div className="text-xs opacity-75">Incorrect but familiar</div>
                  </div>
                </button>

                <button
                  onClick={() => handleReview(3)}
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  <div className="text-left">
                    <div className="font-semibold">
                      Good{' '}
                      <kbd className="ml-1 px-1.5 py-0.5 bg-blue-200 dark:bg-blue-900 rounded text-xs">
                        3
                      </kbd>
                    </div>
                    <div className="text-xs opacity-75">Correct with effort</div>
                  </div>
                </button>

                <button
                  onClick={() => handleReview(5)}
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg transition disabled:opacity-50"
                >
                  <Sparkles size={20} />
                  <div className="text-left">
                    <div className="font-semibold">
                      Easy{' '}
                      <kbd className="ml-1 px-1.5 py-0.5 bg-green-200 dark:bg-green-900 rounded text-xs">
                        4
                      </kbd>
                    </div>
                    <div className="text-xs opacity-75">Perfect recall</div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Use keyboard shortcuts:{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">1</kbd> Forgot,{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">2</kbd> Hard,{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">3</kbd> Good,{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">4</kbd> Easy
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
