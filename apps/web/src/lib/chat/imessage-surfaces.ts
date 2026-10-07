import { cn } from '@/lib/utils';
import type { ClusterPosition } from '@/lib/chat/message-cluster';

/** iMessage-inspired chat tokens — theme-coupled via `html.dark`. */
export const IMESSAGE_TOKENS = {
  userBubble: '#0A84FF',
  incomingBubbleDark: '#1C1C1E',
  incomingBubbleLight: '#E9E9EB',
  chatBgLight: '#F9FAFB',
  chatBgDark: '#000000',
  radius: 18,
  clusterRadius: 4,
  maxWidthPercent: 70,
  horizontalInsetPx: 16,
  sameSenderGapPx: 2,
  crossSenderGapPx: 12,
} as const;

export const chatPageRootClassName = 'bg-gray-50 dark:bg-black';

export const chatThreadHeaderClassName =
  'relative z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm dark:border-gray-800/80 dark:bg-black/95';

export const chatThreadHeaderTitleClassName =
  'truncate text-[15px] font-semibold text-gray-900 sm:text-base dark:text-white';

export const chatThreadHeaderSubtitleClassName =
  'truncate text-[11px] text-gray-500 dark:text-gray-400';

export const chatThreadHeaderMenuClassName =
  'absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900';

export const chatThreadHeaderMenuItemClassName =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10';

export const chatThreadHeaderPopoverClassName =
  'hidden lg:block absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,calc(100vh-8rem))] z-50 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl p-3 text-left dark:border-gray-700 dark:bg-gray-900';

export const chatThreadContextDetailsClassName =
  'mt-2 text-left text-[11px] text-gray-500 dark:text-gray-400';

export const chatThreadContextSummaryClassName =
  'cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300';

export const chatThreadContextDividerClassName =
  'mt-1 space-y-1 border-t border-gray-200 pt-1 dark:border-gray-800';

export const chatTranscriptBgClassName = 'bg-gray-50 dark:bg-black';

export const chatComposerShellClassName =
  'border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-black/95';

export const chatThreadListShellClassName = 'bg-white dark:bg-gray-900';

export const chatThreadListHeaderBorderClassName =
  'border-b border-gray-200 px-3 py-2 dark:border-gray-800';

export const chatShellColumnClassName = 'bg-gray-50 dark:bg-black';

export const chatShellCollapseBtnClassName =
  'hidden lg:inline-flex absolute top-1/2 -translate-y-1/2 z-20 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-200';

export const chatComposerInputPillClassName =
  'flex min-h-[36px] flex-1 items-end gap-1 rounded-[20px] border border-gray-300/60 bg-gray-100 px-3 py-1.5 dark:border-gray-600/40 dark:bg-[#1C1C1E]';

export const chatEmptyStateTextClassName = 'text-gray-500 dark:text-gray-400';

/** Shared max width for chat bubbles and assistant chrome (execution trace, thinking). */
export const chatBubbleMaxWidthClassName = 'max-w-[70%]';

/** Left-aligned assistant chrome (trace/thinking/pre-trace) matches bubble width. */
export const chatAssistantChromeWidthClassName = cn(
  'w-full',
  chatBubbleMaxWidthClassName,
  'mr-auto'
);

/** Tailwind-friendly fixed radius classes (arbitrary values inlined for JIT). */
export function getBubbleRadiusClassName(
  role: 'user' | 'assistant',
  position: ClusterPosition
): string {
  const r = 'rounded-[18px]';
  if (role === 'user') {
    switch (position) {
      case 'solo':
        return cn(r, 'rounded-br-[4px]');
      case 'first':
        return 'rounded-tl-[18px] rounded-tr-[18px] rounded-bl-[18px] rounded-br-[4px]';
      case 'middle':
        return 'rounded-tl-[18px] rounded-tr-[4px] rounded-bl-[18px] rounded-br-[4px]';
      case 'last':
        return 'rounded-tl-[18px] rounded-tr-[4px] rounded-bl-[18px] rounded-br-[4px]';
    }
  }
  switch (position) {
    case 'solo':
      return cn(r, 'rounded-bl-[4px]');
    case 'first':
      return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]';
    case 'middle':
      return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]';
    case 'last':
      return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]';
  }
}

export function getBubbleSurfaceClassName(
  role: 'user' | 'assistant',
  position: ClusterPosition,
  density: 'default' | 'compact' = 'default'
): string {
  const pad =
    density === 'compact'
      ? 'px-3 py-2 text-sm'
      : 'px-3.5 py-2 sm:px-4 sm:py-2.5 text-[15px] leading-snug';
  const radius = getBubbleRadiusClassName(role, position);
  const color =
    role === 'user'
      ? 'bg-[#0A84FF] text-white'
      : 'bg-[#E9E9EB] text-gray-900 dark:bg-[#1C1C1E] dark:text-gray-100';
  return cn('min-w-0', chatBubbleMaxWidthClassName, 'relative', pad, radius, color);
}

export function showBubbleTail(_role: 'user' | 'assistant', position: ClusterPosition): boolean {
  return position === 'solo' || position === 'last';
}
