import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import ReplyGenerationPanel from '@/components/molecules/personal-branding/ReplyGenerationPanel';
import ReplySuggestionsList from '@/components/molecules/personal-branding/ReplySuggestionsList';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { cn } from '@/lib/utils';
import { FormTextarea } from '../PersonalBrandingFormFields';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type CreatorConnection,
  type ReplyGenerationDraft,
  type ReplyRun,
  type ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import { Select } from '@/components/atoms/Select';

const PLATFORMS: BrandPlatform[] = [
  'linkedin',
  'x',
  'medium',
  'youtube',
  'instagram',
  'newsletter',
];

interface RolodexPrompterDrawerProps {
  open: boolean;
  connection: CreatorConnection | null;
  profiles: { id: string; name: string }[];
  defaultProfileId?: string | null;
  activeRun?: ReplyRun | null;
  isGenerating?: boolean;
  isUpdatingSuggestion?: boolean;
  initialCreatorText?: string;
  initialInteractionIntent?: string;
  initialAuthorHandle?: string | null;
  onClose: () => void;
  onGenerate: (
    payload: {
      creatorText: string;
      platform: BrandPlatform;
      interactionIntent?: string;
    },
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => void;
  onAcceptSuggestion: (suggestion: ReplySuggestion, creatorText: string) => void;
  onRejectSuggestion: (suggestion: ReplySuggestion, feedbackText: string | null) => void;
}

export default function RolodexPrompterDrawer({
  open,
  connection,
  profiles,
  defaultProfileId,
  activeRun,
  isGenerating = false,
  isUpdatingSuggestion = false,
  initialCreatorText = '',
  initialInteractionIntent = '',
  initialAuthorHandle,
  onClose,
  onGenerate,
  onAcceptSuggestion,
  onRejectSuggestion,
}: RolodexPrompterDrawerProps) {
  const [creatorText, setCreatorText] = useState('');
  const [platform, setPlatform] = useState<BrandPlatform>('x');
  const [interactionIntent, setInteractionIntent] = useState('');

  useEffect(() => {
    if (!open) return;
    setCreatorText(initialCreatorText);
    setPlatform('x');
    setInteractionIntent(initialInteractionIntent);
  }, [open, initialCreatorText, initialInteractionIntent]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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

  if (!connection) return null;

  const suggestions = activeRun?.suggestions ?? [];
  const showRunProgress =
    isGenerating || activeRun?.status === 'QUEUED' || activeRun?.status === 'RUNNING';

  return (
    <AnimatePresence>
      {open ? (
        <OverlayPortal>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 cursor-default bg-black/50 backdrop-blur-[2px]',
              overlayBackdropClassName
            )}
            aria-label="Close response prompter"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Rolodex response prompter"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={cn(
              'fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800',
              overlaySurfaceClassName
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Response prompter
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {connection.name}
                    {initialAuthorHandle ? ` · @${initialAuthorHandle}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Platform
                </label>
                <Select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as BrandPlatform)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {BRAND_PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Creator text
                </label>
                <FormTextarea
                  value={creatorText}
                  onChange={(e) => setCreatorText(e.target.value)}
                  placeholder="Paste their post or message…"
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Intent (optional)
                </label>
                <FormTextarea
                  value={interactionIntent}
                  onChange={(e) => setInteractionIntent(e.target.value)}
                  placeholder="Warm follow-up, technical debate, share resource…"
                />
              </div>

              <ReplyGenerationPanel
                profiles={profiles}
                defaultProfileId={defaultProfileId}
                disabled={!creatorText.trim() || showRunProgress}
                isGenerating={showRunProgress}
                onGenerate={(draft, resolved) =>
                  onGenerate(
                    {
                      creatorText: creatorText.trim(),
                      platform,
                      interactionIntent: interactionIntent.trim() || undefined,
                    },
                    draft,
                    resolved
                  )
                }
              />

              {showRunProgress && !suggestions.length ? (
                <div className="flex justify-center py-8">
                  <AIThinkingIndicator message="Crafting replies…" size="lg" />
                </div>
              ) : null}

              {activeRun?.status === 'FAILED' && activeRun.error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{activeRun.error}</p>
              ) : null}

              <ReplySuggestionsList
                suggestions={suggestions}
                isUpdating={isUpdatingSuggestion}
                onAccept={(s) => onAcceptSuggestion(s, creatorText.trim())}
                onReject={onRejectSuggestion}
              />
            </div>
          </motion.aside>
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
