import { useEffect, useRef, useState } from 'react';
import Button from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { cn } from '@/lib/utils';
import {
  pbBodySecondaryClassName,
  pbEyebrowClassName,
  pbFeedbackTextClassName,
  pbFormLabelClassName,
  pbMetaClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectIdea } from '@/types/api/personal-branding.dto';

const MESSAGE_MAX_LENGTH = 2000;

export interface BuildIdeaRefinePanelProps {
  idea: BrandProjectIdea;
  kitInFlight: boolean;
  isSending: boolean;
  errorMessage: string | null;
  onSend: (message: string) => Promise<unknown>;
}

export default function BuildIdeaRefinePanel({
  idea,
  kitInFlight,
  isSending,
  errorMessage,
  onSend,
}: BuildIdeaRefinePanelProps) {
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const transcript = idea.refineTranscript ?? [];

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [transcript.length]);

  if (idea.status !== 'generated') return null;

  const locked = Boolean(idea.buildKit) || kitInFlight;
  const trimmed = draft.trim();
  const canSend =
    trimmed.length >= 1 && trimmed.length <= MESSAGE_MAX_LENGTH && !isSending && !locked;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await onSend(trimmed);
      setDraft('');
    } catch {
      // Parent surfaces errorMessage. Keep the draft.
    }
  };

  return (
    <section
      aria-labelledby="build-idea-refine-heading"
      className="space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700"
    >
      <h2 id="build-idea-refine-heading" className={pbEyebrowClassName}>
        Refine
      </h2>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="max-h-64 space-y-2 overflow-y-auto"
      >
        {transcript.length === 0 ? (
          <p className={pbBodySecondaryClassName}>
            Ask for a change. The brief updates when the revision lands.
          </p>
        ) : (
          transcript.map((entry, index) => (
            <div
              key={`${entry.createdAt}-${entry.role}-${index}`}
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2',
                entry.role === 'user'
                  ? 'ml-auto bg-gray-100 dark:bg-gray-800'
                  : 'mr-auto border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
              )}
            >
              <p className={pbMetaClassName}>{entry.role === 'user' ? 'You' : 'Revision'}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>

      {locked ? (
        <p className={pbBodySecondaryClassName}>Refine is locked once a build kit exists.</p>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <label htmlFor="build-idea-refine-message" className={pbFormLabelClassName}>
            Message
          </label>
          <Textarea
            id="build-idea-refine-message"
            value={draft}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={2}
            disabled={isSending}
            placeholder='e.g. "Make the demo a CLI instead of a web app"'
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          {errorMessage ? (
            <p role="alert" className={pbFeedbackTextClassName('danger')}>
              {errorMessage}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!canSend}>
              {isSending ? 'Revising…' : 'Send'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
