import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  countPreviewChars,
  getPlatformCharacterLimit,
  getPlatformPreviewSkin,
} from '@/lib/personal-branding/platform-preview-skins';
import { BRAND_PLATFORM_LABELS, type BrandPlatform } from '@/types/api/personal-branding.dto';

export interface PlatformPreviewChromeProps {
  platform: BrandPlatform;
  content: string;
  characterMinimum?: number | null;
  characterLimit?: number | null;
  readTimeMinimumMinutes?: number | null;
  readTimeLimitMinutes?: number | null;
  children: ReactNode;
  className?: string;
}

export default function PlatformPreviewChrome({
  platform,
  content,
  characterMinimum,
  characterLimit,
  readTimeMinimumMinutes,
  readTimeLimitMinutes,
  children,
  className,
}: PlatformPreviewChromeProps) {
  const skin = getPlatformPreviewSkin(platform);
  const charCount = countPreviewChars(content);
  const charLimit =
    characterLimit === undefined ? getPlatformCharacterLimit(platform) : characterLimit;
  const overLimit = charLimit != null && charCount > charLimit;
  const underLimit = characterMinimum != null && charCount < characterMinimum;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = wordCount / 200;
  const underReadTime = readTimeMinimumMinutes != null && readTime < readTimeMinimumMinutes;
  const overReadTime = readTimeLimitMinutes != null && readTime > readTimeLimitMinutes;
  const hasReadTimeWarning = underReadTime || overReadTime;
  const hasWarning = Boolean(underLimit || overLimit || hasReadTimeWarning);

  return (
    <div
      data-testid="platform-preview-chrome"
      data-platform={platform}
      className={cn('mx-auto w-full', skin.maxWidthClass, className)}
    >
      <div
        className={cn(
          'sticky top-0 z-[1] mb-3 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs',
          'border-gray-200 bg-gray-50/95 text-gray-600 backdrop-blur-sm',
          'dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-400'
        )}
      >
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {BRAND_PLATFORM_LABELS[platform]} preview
        </span>
        <span
          className={cn(
            'tabular-nums',
            hasWarning
              ? 'font-medium text-amber-700 dark:text-amber-300'
              : 'text-gray-500 dark:text-gray-400'
          )}
          aria-live="polite"
        >
          {charCount}/{characterMinimum != null ? `${characterMinimum}–` : ''}
          {charLimit ?? '∞'} chars
          {readTimeMinimumMinutes != null || readTimeLimitMinutes != null
            ? ` · ${readTime.toFixed(1)}m`
            : ''}
        </span>
      </div>
      {hasWarning ? (
        <p className="px-4 text-[11px] text-amber-700 dark:text-amber-300">
          {underLimit || overLimit ? (
            <>
              Target: {characterMinimum != null ? `${characterMinimum}–` : 'up to '}
              {charLimit ?? '∞'} characters
            </>
          ) : null}
          {hasReadTimeWarning ? (
            <>
              {underLimit || overLimit ? '; ' : ''}
              Read time target:{' '}
              {readTimeMinimumMinutes != null ? `${readTimeMinimumMinutes}–` : 'up to '}
              {readTimeLimitMinutes ?? '∞'} minutes
            </>
          ) : null}
        </p>
      ) : null}
      <div className={cn('px-4 py-3', skin.frameClassName)}>
        <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">{skin.linkHint}</p>
        {children}
      </div>
    </div>
  );
}
