import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { goalAdvisoriesService } from '@/services/growth-system/goal-advisories.service';
import type { GoalAdvisory } from '@/types/growth-system';
import { ROUTES } from '@/routes';

export function StaleVelocityAdvisoryCard() {
  const [advisories, setAdvisories] = useState<GoalAdvisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await goalAdvisoriesService.listActive();
      setAdvisories(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load advisories');
      setAdvisories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDismiss = async (advisoryId: string) => {
    try {
      await goalAdvisoriesService.dismiss(advisoryId);
      setAdvisories((prev) => prev.filter((a) => a.id !== advisoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  };

  if (loading || advisories.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Stale goal velocity</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            These active goals have had no linked task, metric, or habit activity recently.
          </p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {advisories.map((advisory) => (
          <li
            key={advisory.id}
            className="flex items-center justify-between gap-3 rounded-md bg-white/80 dark:bg-gray-900/50 px-3 py-2 border border-amber-100 dark:border-amber-900"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {advisory.goalTitle}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {advisory.daysSinceActivity} days without velocity ·{' '}
                <span className="capitalize">{advisory.severity}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`${ROUTES.admin.goals}?goal=${advisory.goalId}`}
                className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
              >
                View goal
              </Link>
              <button
                type="button"
                onClick={() => void handleDismiss(advisory.id)}
                className="p-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                aria-label={`Dismiss advisory for ${advisory.goalTitle}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
