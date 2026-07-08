import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { cn } from '@/lib/utils';
import ProfileOutputTestHistory from './ProfileOutputTestHistory';
import type {
  BrandPlatform,
  BrandProfileOutputTest,
  BrandProfileStatus,
  GenerateProfileOutputTestInput,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';

const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export interface ProfileFormSnapshot {
  name: string;
  description: string | null;
  pillars: string[];
  targetAudience: string | null;
  toneMetrics: Record<string, number>;
  bannedPhrases: string[];
  status: BrandProfileStatus;
}

interface ProfileLiveOutputTestPanelProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
  isLocalDraft: boolean;
  formSnapshot: ProfileFormSnapshot;
  onEnsureSaved: (snapshot: ProfileFormSnapshot) => Promise<string>;
  onGenerate: (
    profileId: string,
    body: GenerateProfileOutputTestInput
  ) => Promise<BrandProfileOutputTest>;
  history: BrandProfileOutputTest[];
  historyLoading?: boolean;
  disabled?: boolean;
}

export default function ProfileLiveOutputTestPanel({
  open,
  onClose,
  profileId,
  profileName,
  isLocalDraft,
  formSnapshot,
  onEnsureSaved,
  onGenerate,
  history,
  historyLoading = false,
  disabled = false,
}: ProfileLiveOutputTestPanelProps) {
  const [topic, setTopic] = useState('How I approach building in public');
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<BrandProfileOutputTest | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const selectedTest = useMemo(
    () => history.find((test) => test.id === selectedTestId) ?? null,
    [history, selectedTestId]
  );

  const displayedResult = latestResult ?? selectedTest;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isGenerating]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Enter a sample topic to generate a preview.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const savedProfileId = isLocalDraft ? await onEnsureSaved(formSnapshot) : profileId;
      const saved = await onGenerate(savedProfileId, {
        topic: trimmedTopic,
        contentType: 'DEEP_DIVE_BLOG',
        platform,
      });
      setSelectedTestId(null);
      setLatestResult(saved);
    } catch (err) {
      setLatestResult(null);
      setError(err instanceof Error ? err.message : 'Preview generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (test: BrandProfileOutputTest) => {
    setSelectedTestId(test.id);
    setLatestResult(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px]"
            aria-label="Close live output test"
            onClick={() => {
              if (!isGenerating) onClose();
            }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Live output test"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Live Output Test
                </h2>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Preview how <span className="font-medium">{profileName}</span> shapes a generated
                  draft. Unsaved edits are saved before generating.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close live output test panel"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Sample topic
                  </label>
                  <FormInput
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What should the draft be about?"
                    disabled={disabled || isGenerating}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Target platform
                  </label>
                  <Select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
                    disabled={disabled || isGenerating}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                  >
                    {PLATFORMS.map((value) => (
                      <option key={value} value={value}>
                        {BRAND_PLATFORM_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleGenerate()}
                  disabled={disabled || isGenerating || !topic.trim()}
                  className="inline-flex w-full items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Generating preview…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" aria-hidden />
                      Generate preview
                    </>
                  )}
                </Button>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              <div
                className={cn(
                  'min-h-[200px] overflow-y-auto rounded-lg border-2 border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-950/40',
                  !displayedResult && 'flex items-center justify-center'
                )}
              >
                {displayedResult ? (
                  <article className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {displayedResult.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {BRAND_PLATFORM_LABELS[displayedResult.platform]} ·{' '}
                        {new Date(displayedResult.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {displayedResult.profileVersionId
                          ? ` · version ${displayedResult.profileVersionId.slice(0, 8)}`
                          : ''}
                      </p>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {displayedResult.body}
                    </div>
                  </article>
                ) : (
                  <p className="max-w-xs text-center text-xs text-gray-500 dark:text-gray-400">
                    Adjust tone metrics and pillars, then generate a preview to see how they
                    influence the draft voice.
                  </p>
                )}
              </div>

              <ProfileOutputTestHistory
                tests={history}
                isLoading={historyLoading}
                selectedTestId={selectedTestId}
                onSelect={handleSelectHistory}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
