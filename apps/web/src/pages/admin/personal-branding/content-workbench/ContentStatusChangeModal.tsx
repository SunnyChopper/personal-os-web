import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { Select } from '@/components/atoms/Select';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';
import { DialogFooter } from '../PersonalBrandingPageTemplate';

export type ContentStatusChangeMode = 'publish' | 'unpublish';

export interface PublishContentMetadata {
  platform: BrandPlatform;
  canonicalUrl: string;
}

interface ContentStatusChangeModalProps {
  isOpen: boolean;
  mode: ContentStatusChangeMode;
  contentTitle: string;
  wordCount?: number;
  readingTimeMinutes?: number;
  initialPlatform?: BrandPlatform | null;
  initialCanonicalUrl?: string | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (metadata?: PublishContentMetadata) => void;
}

function isValidCanonicalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ContentStatusChangeModal({
  isOpen,
  mode,
  contentTitle,
  wordCount,
  readingTimeMinutes,
  initialPlatform,
  initialCanonicalUrl,
  isPending,
  onClose,
  onConfirm,
}: ContentStatusChangeModalProps) {
  const isPublish = mode === 'publish';
  const title = isPublish ? 'Mark as published?' : 'Move back to draft?';
  const displayTitle = contentTitle.trim() || 'Untitled draft';
  const [platform, setPlatform] = useState<BrandPlatform | ''>('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);

  useEffect(() => {
    if (!isOpen || !isPublish) return;
    setPlatform(initialPlatform ?? '');
    setCanonicalUrl(initialCanonicalUrl ?? '');
    setUrlTouched(false);
  }, [initialCanonicalUrl, initialPlatform, isOpen, isPublish]);

  const urlError =
    isPublish && urlTouched && canonicalUrl.trim() && !isValidCanonicalUrl(canonicalUrl)
      ? 'Enter a valid http:// or https:// URL'
      : null;
  const canPublish =
    isPublish && Boolean(platform) && isValidCanonicalUrl(canonicalUrl) && !urlError;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onClose();
      }}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {isPublish ? (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              You are about to mark{' '}
              <span className="font-medium text-gray-900 dark:text-white">{displayTitle}</span> as
              published.
            </p>
            <dl className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">Word count</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{wordCount ?? 0}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">Approx. read time</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {readingTimeMinutes ?? 0} min
                </dd>
              </div>
            </dl>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="publish-platform"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Original platform <span className="text-red-500">*</span>
                </label>
                <Select
                  id="publish-platform"
                  value={platform}
                  onChange={(e) => setPlatform((e.target.value as BrandPlatform) || '')}
                  aria-label="Original platform"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                >
                  <option value="">Select platform</option>
                  {(Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[]).map((value) => (
                    <option key={value} value={value}>
                      {BRAND_PLATFORM_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="publish-canonical-url"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Canonical URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="publish-canonical-url"
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  onBlur={() => setUrlTouched(true)}
                  placeholder="https://medium.com/@you/post-slug"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
                {urlError ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{urlError}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Link to the live post on the original platform.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            Move <span className="font-medium text-gray-900 dark:text-white">{displayTitle}</span>{' '}
            back to draft? It will no longer be marked as published.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (isPublish) {
                if (!canPublish || !platform) return;
                onConfirm({
                  platform,
                  canonicalUrl: canonicalUrl.trim(),
                });
                return;
              }
              onConfirm();
            }}
            disabled={isPending || (isPublish && !canPublish)}
            className={
              isPublish
                ? undefined
                : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
            }
          >
            {isPending
              ? isPublish
                ? 'Publishing…'
                : 'Moving…'
              : isPublish
                ? 'Mark published'
                : 'Move to draft'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
