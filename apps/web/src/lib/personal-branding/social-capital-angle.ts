import type { SocialCapitalAngle } from '@/types/api/personal-branding.dto';
import { SOCIAL_CAPITAL_ANGLE_LABELS } from '@/types/api/personal-branding.dto';

const LEGACY_ANGLE_ALIASES: Record<string, SocialCapitalAngle> = {
  join_connections: 'joinConnections',
};

export function normalizeSocialCapitalAngleKey(angle?: string | null): SocialCapitalAngle | null {
  if (!angle?.trim()) return null;
  const trimmed = angle.trim();
  if (trimmed in SOCIAL_CAPITAL_ANGLE_LABELS) {
    return trimmed as SocialCapitalAngle;
  }
  const legacy = LEGACY_ANGLE_ALIASES[trimmed.toLowerCase()];
  if (legacy) return legacy;
  const camel = trimmed.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
  if (camel in SOCIAL_CAPITAL_ANGLE_LABELS) {
    return camel as SocialCapitalAngle;
  }
  return null;
}

export function formatSocialCapitalAngleLabel(angle?: string | null): string {
  const key = normalizeSocialCapitalAngleKey(angle);
  if (key) return SOCIAL_CAPITAL_ANGLE_LABELS[key];
  if (!angle?.trim()) return 'Engagement';
  return angle
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
