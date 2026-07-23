import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import { cn } from '@/lib/utils';
import {
  linkAccentClassName,
  pbDenseListStackClassName,
  pbFormLabelClassName,
  pbMetaClassName,
} from '../personal-branding-ui';
import type {
  BrandPlatform,
  ContentVariant,
  ContentVariantEngagement,
  UpdateVariantDistributionStatusInput,
} from '@/types/api/personal-branding.dto';
import { formatEngagementSummary } from './variant-card-helpers';

interface VariantDistributionTrackingFormProps {
  variant: ContentVariant;
  isSaving: boolean;
  onSave: (variantId: string, body: UpdateVariantDistributionStatusInput) => void;
}

const PLATFORM_URL_PLACEHOLDER: Record<BrandPlatform, string> = {
  linkedin: 'https://www.linkedin.com/posts/…',
  x: 'https://x.com/username/status/…',
  medium: 'https://medium.com/@username/…',
  youtube: 'https://www.youtube.com/watch?v=…',
  instagram: 'https://www.instagram.com/p/…',
  newsletter: 'https://newsletter.example.com/posts/…',
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function engagementMetricString(value: number | null | undefined): string {
  return value != null ? String(value) : '';
}

function parseEngagementMetric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function formatPostedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function VariantDistributionTrackingForm({
  variant,
  isSaving,
  onSave,
}: VariantDistributionTrackingFormProps) {
  const [platformUrl, setPlatformUrl] = useState(variant.platformUrl ?? '');
  const [postedAtLocal, setPostedAtLocal] = useState(toDatetimeLocalValue(variant.postedAt));
  const [views, setViews] = useState(engagementMetricString(variant.engagement?.views));
  const [likes, setLikes] = useState(engagementMetricString(variant.engagement?.likes));
  const [comments, setComments] = useState(engagementMetricString(variant.engagement?.comments));
  const [shares, setShares] = useState(engagementMetricString(variant.engagement?.shares));

  useEffect(() => {
    setPlatformUrl(variant.platformUrl ?? '');
    setPostedAtLocal(toDatetimeLocalValue(variant.postedAt));
    setViews(engagementMetricString(variant.engagement?.views));
    setLikes(engagementMetricString(variant.engagement?.likes));
    setComments(engagementMetricString(variant.engagement?.comments));
    setShares(engagementMetricString(variant.engagement?.shares));
  }, [variant]);

  const isDirty = useMemo(() => {
    return (
      platformUrl !== (variant.platformUrl ?? '') ||
      postedAtLocal !== toDatetimeLocalValue(variant.postedAt) ||
      views !== engagementMetricString(variant.engagement?.views) ||
      likes !== engagementMetricString(variant.engagement?.likes) ||
      comments !== engagementMetricString(variant.engagement?.comments) ||
      shares !== engagementMetricString(variant.engagement?.shares)
    );
  }, [platformUrl, postedAtLocal, views, likes, comments, shares, variant]);

  const buildPayload = (): UpdateVariantDistributionStatusInput => {
    const nextPlatformUrl = platformUrl.trim() || null;
    const nextPostedAt = fromDatetimeLocalValue(postedAtLocal);
    const engagement: ContentVariantEngagement = {
      views: parseEngagementMetric(views),
      likes: parseEngagementMetric(likes),
      comments: parseEngagementMetric(comments),
      shares: parseEngagementMetric(shares),
    };
    const hasEngagement = Object.values(engagement).some((value) => value != null);

    return {
      platformUrl: nextPlatformUrl,
      postedAt: nextPostedAt,
      engagement: hasEngagement ? engagement : null,
    };
  };

  const handleSave = () => {
    onSave(variant.id, buildPayload());
  };

  const postedSummary = formatPostedAt(variant.postedAt);
  const engagementSummary = formatEngagementSummary(variant.engagement);
  const hasSavedSummary = Boolean(variant.platformUrl || postedSummary || engagementSummary);
  const showFooter = isDirty || hasSavedSummary;

  return (
    <InsetPanel className={cn('mt-4', pbDenseListStackClassName)}>
      <div className="flex flex-wrap items-center gap-2">
        <EyebrowLabel>Distribution tracking</EyebrowLabel>
        {isSaving ? <span className={pbMetaClassName}>Saving…</span> : null}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="block">
          <span className={cn('mb-1 block', pbFormLabelClassName, 'text-xs')}>Platform URL</span>
          <FormInput
            type="url"
            value={platformUrl}
            onChange={(event) => setPlatformUrl(event.target.value)}
            onBlur={handleSave}
            placeholder={PLATFORM_URL_PLACEHOLDER[variant.platform]}
            className="w-full text-sm"
          />
        </label>
        <label className="block">
          <span className={cn('mb-1 block', pbFormLabelClassName, 'text-xs')}>Posted date</span>
          <FormInput
            type="datetime-local"
            value={postedAtLocal}
            onChange={(event) => setPostedAtLocal(event.target.value)}
            onBlur={handleSave}
            className="w-full text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['Views', views, setViews],
            ['Likes', likes, setLikes],
            ['Comments', comments, setComments],
            ['Shares', shares, setShares],
          ] as const
        ).map(([label, value, setValue]) => (
          <label key={label} className="block">
            <span className={cn('mb-1 block', pbFormLabelClassName, 'text-xs')}>{label}</span>
            <FormInput
              type="number"
              min={0}
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={handleSave}
              placeholder="0"
              className="w-full text-right text-sm tabular-nums"
            />
          </label>
        ))}
      </div>

      {showFooter ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <p className={cn('min-w-0 flex-1', pbMetaClassName)}>
            {variant.platformUrl ? (
              <a
                href={variant.platformUrl}
                target="_blank"
                rel="noreferrer"
                className={cn('hover:underline', linkAccentClassName)}
              >
                Live post
              </a>
            ) : null}
            {postedSummary ? (
              <span>
                {variant.platformUrl ? ' · ' : ''}
                Posted {postedSummary}
              </span>
            ) : null}
            {engagementSummary ? <span> · {engagementSummary}</span> : null}
            {!hasSavedSummary && isDirty ? (
              <span className={pbMetaClassName}>Unsaved changes</span>
            ) : null}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Saving…' : 'Save tracking'}
          </Button>
        </div>
      ) : null}
    </InsetPanel>
  );
}
