import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Textarea } from '@/components/atoms/Textarea';
import { DialogFooter } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';
import type {
  FollowConfidenceVerdict,
  FollowSuggestion,
  SubmitFollowConfidenceFeedbackInput,
} from '@/types/api/personal-branding.dto';

const CONFIDENCE_BLURB =
  'Confidence is the model’s estimate of brand and networking fit for this account among recon candidates — informed by your brand pillars, bio, follower scale, and how many tracked connections already follow them. It is not a guarantee of reach or quality. Your feedback below is used as examples on the next ingest ranking.';

function formatConfidencePercent(value?: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

function factorBarClass(score: number): string {
  if (score >= 0.75) return 'bg-green-500';
  if (score >= 0.5) return 'bg-amber-500';
  return 'bg-gray-400';
}

export interface FollowSuggestionConfidenceModalProps {
  isOpen: boolean;
  suggestion: FollowSuggestion | null;
  isExplaining: boolean;
  isSubmittingFeedback: boolean;
  onClose: () => void;
  onExplain: () => void;
  onSubmitFeedback: (payload: SubmitFollowConfidenceFeedbackInput) => void;
}

export default function FollowSuggestionConfidenceModal({
  isOpen,
  suggestion,
  isExplaining,
  isSubmittingFeedback,
  onClose,
  onExplain,
  onSubmitFeedback,
}: FollowSuggestionConfidenceModalProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [suggestedPercent, setSuggestedPercent] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFeedbackText('');
      setSuggestedPercent('');
    }
  }, [isOpen, suggestion?.id]);

  if (!suggestion) return null;

  const handle = suggestion.xUsername;
  const label = suggestion.displayName ?? `@${handle}`;
  const explanation = suggestion.confidenceExplanation;
  const existingFeedback = suggestion.confidenceFeedback;
  const sharedCount = suggestion.sharedConnectionIds.length;

  const handleSubmit = (verdict: FollowConfidenceVerdict) => {
    const trimmed = feedbackText.trim();
    const parsedPercent = suggestedPercent.trim() === '' ? null : Number(suggestedPercent);
    const suggestedConfidence =
      parsedPercent === null || Number.isNaN(parsedPercent)
        ? null
        : Math.min(100, Math.max(0, parsedPercent)) / 100;
    onSubmitFeedback({
      verdict,
      feedbackText: trimmed || null,
      suggestedConfidence,
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Confidence breakdown" size="lg">
      <div className="space-y-5 p-1">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatConfidencePercent(suggestion.confidence)} confidence
          </p>
          {sharedCount > 0 ? (
            <p className="mt-1 text-xs text-gray-500">
              Followed by {sharedCount} tracked connection{sharedCount === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">{CONFIDENCE_BLURB}</p>

        {explanation ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.summary}</p>
            <ul className="space-y-3">
              {explanation.factors.map((factor) => (
                <li
                  key={factor.key}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {factor.label}
                    </span>
                    <span className="text-gray-500">
                      {formatConfidencePercent(factor.score)} · weight{' '}
                      {formatConfidencePercent(factor.weight)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${factorBarClass(factor.score)}`}
                      style={{ width: `${Math.round(factor.score * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{factor.note}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This suggestion was created before structured confidence breakdowns were saved. Run an
              on-demand explanation to generate factor scores.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              disabled={isExplaining}
              onClick={onExplain}
            >
              {isExplaining ? 'Explaining…' : 'Explain with AI'}
            </Button>
          </div>
        )}

        {suggestion.rationale ? (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Why follow
            </h4>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{suggestion.rationale}</p>
          </div>
        ) : null}

        {existingFeedback ? (
          <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900/60">
            <p className="font-medium text-gray-900 dark:text-white">
              Your calibration: {existingFeedback.verdict}
            </p>
            {existingFeedback.suggestedConfidence != null ? (
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Suggested ~{formatConfidencePercent(existingFeedback.suggestedConfidence)}
              </p>
            ) : null}
            {existingFeedback.feedbackText ? (
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {existingFeedback.feedbackText}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Calibrate this confidence
          </h4>
          <p className="text-xs text-gray-500">
            Reject or confirm the score so future suggestions learn from your judgment. This does
            not dismiss the suggestion.
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Feedback <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={3}
            placeholder='e.g. "Too generic for my niche" or "Strong agentic-AI overlap"'
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            I would score this ~{' '}
            <input
              type="number"
              min={0}
              max={100}
              value={suggestedPercent}
              onChange={(e) => setSuggestedPercent(e.target.value)}
              placeholder="40"
              className="mx-1 w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            %<span className="font-normal text-gray-500"> (optional)</span>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isSubmittingFeedback}
            onClick={() => handleSubmit('CONFIRMED')}
          >
            Confirm score
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmittingFeedback}
            onClick={() => handleSubmit('REJECTED')}
            className="bg-red-600 hover:bg-red-700"
          >
            Reject confidence
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
