import type {
  CreatorConnection,
  RelationshipPriority,
  RelationshipStage,
  RelationshipType,
} from '@/types/api/personal-branding.dto';
import type { LucideIcon } from 'lucide-react';
import { AtSign, Briefcase, Camera, Globe, Mail, Newspaper, Video } from 'lucide-react';

export type RolodexPlatformId =
  | 'linkedin'
  | 'x'
  | 'youtube'
  | 'instagram'
  | 'medium'
  | 'newsletter'
  | 'custom';

export interface RolodexPlatformOption {
  id: RolodexPlatformId;
  label: string;
  domainPrefix?: string;
  placeholder?: string;
  requiresFullUrl?: boolean;
  icon: LucideIcon;
}

export const ROLODEX_PLATFORMS: RolodexPlatformOption[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    domainPrefix: 'linkedin.com/in/',
    placeholder: 'username',
    icon: Briefcase,
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    domainPrefix: 'x.com/',
    placeholder: 'username',
    icon: AtSign,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    domainPrefix: 'youtube.com/@',
    placeholder: 'username',
    icon: Video,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    domainPrefix: 'instagram.com/',
    placeholder: 'username',
    icon: Camera,
  },
  {
    id: 'medium',
    label: 'Medium',
    domainPrefix: 'medium.com/@',
    placeholder: 'username',
    icon: Newspaper,
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    placeholder: 'https://newsletter.example.com',
    requiresFullUrl: true,
    icon: Mail,
  },
  {
    id: 'custom',
    label: 'Custom Blog / Website',
    placeholder: 'https://my-blog.com',
    requiresFullUrl: true,
    icon: Globe,
  },
];

export const ROLODEX_QUICK_TAGS = ['AI', 'Tech', 'SaaS', 'VC', 'Design', 'Creator'] as const;

export const ROLODEX_PRIORITY_OPTIONS: {
  value: RelationshipPriority;
  label: string;
  description: string;
}[] = [
  {
    value: 'strategic',
    label: 'Strategic',
    description: 'Highest intent — protect and deepen actively',
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Regular follow-up — monthly touchpoints',
  },
  {
    value: 'nurture',
    label: 'Nurture',
    description: 'Long-game — quarterly check-ins',
  },
  {
    value: 'watch',
    label: 'Watch',
    description: 'Monitor — engage when relevant',
  },
];

export const ROLODEX_STAGE_OPTIONS: {
  value: RelationshipStage;
  label: string;
  description: string;
}[] = [
  { value: 'target', label: 'Target', description: 'Not yet on their radar' },
  { value: 'aware', label: 'Aware', description: 'They know who you are' },
  { value: 'warm', label: 'Warm', description: 'Friendly but not deep yet' },
  { value: 'active', label: 'Active', description: 'Ongoing mutual exchange' },
  { value: 'collaborator', label: 'Collaborator', description: 'Working together' },
  { value: 'paused', label: 'Paused', description: 'Intentionally on hold' },
];

export const ROLODEX_TYPE_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'creator', label: 'Creator' },
  { value: 'founder', label: 'Founder' },
  { value: 'operator', label: 'Operator' },
  { value: 'investor', label: 'Investor' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'potentialCustomer', label: 'Potential customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'other', label: 'Other' },
];

export const ROLODEX_CADENCE_PRESETS = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Biweekly' },
  { days: 30, label: 'Monthly' },
  { days: 90, label: 'Quarterly' },
] as const;

const LEGACY_TIER_TO_PRIORITY: Record<string, RelationshipPriority> = {
  a: 'strategic',
  b: 'active',
  c: 'nurture',
  watch: 'watch',
};

/** Resolve display priority from new field or legacy tier. */
export function resolveRelationshipPriority(
  connection: Pick<CreatorConnection, 'relationshipPriority' | 'tier'>
): RelationshipPriority | null {
  if (connection.relationshipPriority) return connection.relationshipPriority;
  const legacy = connection.tier?.trim().toLowerCase();
  if (!legacy) return null;
  return LEGACY_TIER_TO_PRIORITY[legacy] ?? null;
}

const HANDLE_PLATFORM_IDS: RolodexPlatformId[] = [
  'linkedin',
  'x',
  'youtube',
  'instagram',
  'medium',
  'newsletter',
];

export function getPlatformOption(
  id: RolodexPlatformId | null | undefined
): RolodexPlatformOption | undefined {
  if (!id) return undefined;
  return ROLODEX_PLATFORMS.find((platform) => platform.id === id);
}

export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

export function buildProfileUrl(platformId: RolodexPlatformId, handleOrUrl: string): string | null {
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return null;

  const platform = getPlatformOption(platformId);
  if (!platform) return null;

  if (platform.requiresFullUrl) {
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  }

  const handle = normalizeHandle(trimmed);
  if (!handle) return null;
  return `https://${platform.domainPrefix ?? ''}${handle}`;
}

export function buildHandles(
  platformId: RolodexPlatformId,
  handleOrUrl: string
): Record<string, string> {
  const trimmed = handleOrUrl.trim();
  if (!trimmed || platformId === 'custom') return {};

  if (platformId === 'newsletter') {
    const url = buildProfileUrl(platformId, trimmed);
    return url ? { newsletter: url } : {};
  }

  const handle = normalizeHandle(trimmed);
  if (!handle) return {};
  return { [platformId]: `@${handle}` };
}

export function parseConnectionProfile(connection: {
  targetProfileUrl?: string | null;
  handles?: Record<string, string>;
}): { platformId: RolodexPlatformId | null; handleOrUrl: string } {
  const handles = connection.handles ?? {};

  for (const id of HANDLE_PLATFORM_IDS) {
    const stored = handles[id]?.trim();
    if (!stored) continue;
    if (id === 'newsletter') {
      return { platformId: id, handleOrUrl: stored };
    }
    return { platformId: id, handleOrUrl: normalizeHandle(stored) };
  }

  const url = connection.targetProfileUrl?.trim();
  if (!url) return { platformId: null, handleOrUrl: '' };

  try {
    const normalized =
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.replace(/\/$/, '').split('/').filter(Boolean);

    if (host === 'linkedin.com' && segments[0] === 'in' && segments[1]) {
      return { platformId: 'linkedin', handleOrUrl: segments[1] };
    }
    if ((host === 'x.com' || host === 'twitter.com') && segments[0]) {
      return { platformId: 'x', handleOrUrl: segments[0] };
    }
    if (host === 'youtube.com') {
      if (segments[0]?.startsWith('@')) {
        return { platformId: 'youtube', handleOrUrl: segments[0].slice(1) };
      }
      if ((segments[0] === 'channel' || segments[0] === 'c') && segments[1]) {
        return { platformId: 'youtube', handleOrUrl: segments[1] };
      }
    }
    if (host === 'instagram.com' && segments[0]) {
      return { platformId: 'instagram', handleOrUrl: segments[0] };
    }
    if (host === 'medium.com' && segments[0]?.startsWith('@')) {
      return { platformId: 'medium', handleOrUrl: segments[0].slice(1) };
    }

    return { platformId: 'custom', handleOrUrl: normalized };
  } catch {
    return { platformId: 'custom', handleOrUrl: url };
  }
}

export interface ProfileDisplayInfo {
  platformId: RolodexPlatformId | null;
  label: string;
  url: string | null;
}

export function getProfileDisplay(connection: CreatorConnection): ProfileDisplayInfo {
  const parsed = parseConnectionProfile(connection);
  const url = connection.targetProfileUrl?.trim() || null;

  if (!parsed.platformId) {
    return { platformId: null, label: 'No profile', url };
  }

  const platform = getPlatformOption(parsed.platformId);
  if (!platform) {
    return { platformId: parsed.platformId, label: parsed.handleOrUrl || 'Profile', url };
  }

  if (platform.requiresFullUrl) {
    const displayUrl = parsed.handleOrUrl || url || '';
    let label = displayUrl;
    try {
      label = new URL(displayUrl.startsWith('http') ? displayUrl : `https://${displayUrl}`)
        .hostname;
    } catch {
      label = displayUrl;
    }
    return {
      platformId: parsed.platformId,
      label,
      url: url ?? buildProfileUrl(parsed.platformId, parsed.handleOrUrl),
    };
  }

  const handle = normalizeHandle(parsed.handleOrUrl);
  return {
    platformId: parsed.platformId,
    label: handle ? `@${handle}` : platform.label,
    url: url ?? buildProfileUrl(parsed.platformId, handle),
  };
}

export function priorityBadgeClassName(priority?: RelationshipPriority | null): string {
  switch (priority) {
    case 'strategic':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'active':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    case 'nurture':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'watch':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

export function stageBadgeClassName(stage?: RelationshipStage | null): string {
  switch (stage) {
    case 'collaborator':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'active':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    case 'warm':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'aware':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'target':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case 'paused':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

export function followUpSortKey(connection: CreatorConnection): number {
  if (connection.nextFollowUpAt) {
    return new Date(connection.nextFollowUpAt).getTime();
  }
  if (!connection.lastInteractedAt) return Number.MAX_SAFE_INTEGER;
  return Date.now() - new Date(connection.lastInteractedAt).getTime();
}
