import { Eye, Heart, MessageCircle, Quote, SkipForward } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  recommendedActionBadgeClassName,
  recommendedActionIconKind,
  type RecommendedActionIconKind,
} from '@/lib/personal-branding/recommended-action-display';
import { cn } from '@/lib/utils';
import { RECON_RECOMMENDED_ACTION_LABELS } from '@/types/api/personal-branding.dto';

const ACTION_ICONS: Record<RecommendedActionIconKind, LucideIcon | null> = {
  reply: MessageCircle,
  quote: Quote,
  like: Heart,
  monitor: Eye,
  skip: SkipForward,
  other: null,
};

export interface RecommendedActionBadgeProps {
  action?: string | null;
  className?: string;
}

export default function RecommendedActionBadge({ action, className }: RecommendedActionBadgeProps) {
  const normalized = (action ?? '').trim().toLowerCase();
  if (!normalized) return null;

  const kind = recommendedActionIconKind(action);
  const label = RECON_RECOMMENDED_ACTION_LABELS[normalized] ?? action ?? '—';
  const Icon = ACTION_ICONS[kind];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        recommendedActionBadgeClassName(action),
        className
      )}
    >
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      <span>{label}</span>
    </span>
  );
}
