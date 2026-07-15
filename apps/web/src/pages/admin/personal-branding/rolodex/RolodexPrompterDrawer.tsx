import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import Button from '@/components/atoms/Button';
import { FormTextarea } from '../PersonalBrandingFormFields';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type CreatorConnection,
  type RolodexResponseVectorItem,
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
  profileId?: string | null;
  isLoading?: boolean;
  vectors: RolodexResponseVectorItem[] | null;
  initialCreatorText?: string;
  onClose: () => void;
  onGenerate: (payload: {
    creatorText: string;
    platform: BrandPlatform;
    interactionIntent?: string;
  }) => void;
  onUseVector: (vector: RolodexResponseVectorItem, creatorText: string) => void;
}

export default function RolodexPrompterDrawer({
  open,
  connection,
  profileId,
  isLoading = false,
  vectors,
  initialCreatorText = '',
  onClose,
  onGenerate,
  onUseVector,
}: RolodexPrompterDrawerProps) {
  const [creatorText, setCreatorText] = useState('');
  const [platform, setPlatform] = useState<BrandPlatform>('x');
  const [interactionIntent, setInteractionIntent] = useState('');

  useEffect(() => {
    if (!open) return;
    setCreatorText(initialCreatorText);
    setPlatform('x');
    setInteractionIntent('');
  }, [open, initialCreatorText]);

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
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{connection.name}</p>
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
              {connection.desiredOutcome ||
              connection.valueExchange ||
              connection.nextAction ||
              (connection.conversationAngles?.length ?? 0) > 0 ? (
                <section className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-200">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Relationship context
                  </h3>
                  {connection.desiredOutcome ? (
                    <p className="mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Outcome: </span>
                      {connection.desiredOutcome}
                    </p>
                  ) : null}
                  {connection.valueExchange ? (
                    <p className="mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Offer: </span>
                      {connection.valueExchange}
                    </p>
                  ) : null}
                  {connection.nextAction ? (
                    <p className="mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Next action: </span>
                      {connection.nextAction}
                    </p>
                  ) : null}
                  {(connection.conversationAngles?.length ?? 0) > 0 ? (
                    <p>
                      <span className="text-gray-500 dark:text-gray-400">Angles: </span>
                      {connection.conversationAngles.join(' · ')}
                    </p>
                  ) : null}
                </section>
              ) : null}

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

              <Button
                type="button"
                size="sm"
                disabled={!creatorText.trim() || isLoading}
                onClick={() =>
                  onGenerate({
                    creatorText: creatorText.trim(),
                    platform,
                    interactionIntent: interactionIntent.trim() || undefined,
                  })
                }
                className="w-full"
              >
                Generate 3 vectors
              </Button>

              {profileId ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Using Brand Identity profile rules server-side.
                </p>
              ) : null}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <AIThinkingIndicator message="Crafting vectors…" size="lg" />
                </div>
              ) : null}

              {vectors?.length === 3 ? (
                <div className="space-y-3">
                  {vectors.map((vector) => (
                    <article
                      key={vector.id}
                      className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {vector.label}
                        </h3>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {vector.angle}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {vector.draftText}
                      </p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {vector.rationale}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onUseVector(vector, creatorText)}
                        className="mt-3"
                      >
                        Copy & log
                      </Button>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
