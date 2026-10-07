import { Link } from 'react-router-dom';
import { brandIdentityHref } from '@/lib/personal-branding/brand-identity-deep-links';
import { pbWarningActionLinkClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { AlertBanner } from '@/pages/admin/personal-branding/PersonalBrandingPageTemplate';

export type BrandProfileReadinessVariant = 'missing-profile' | 'incomplete-profile';

const DEFAULT_MESSAGES: Record<BrandProfileReadinessVariant, string> = {
  'missing-profile':
    'Create a Brand Identity profile with core pillars and a target audience before generating ideas.',
  'incomplete-profile':
    'Selected profile needs at least one pillar and a target audience in Brand Identity.',
};

const ACTION_LABELS: Record<BrandProfileReadinessVariant, string> = {
  'missing-profile': 'Open Brand Identity',
  'incomplete-profile': 'Fix pillars & audience',
};

interface BrandProfileReadinessCalloutProps {
  variant: BrandProfileReadinessVariant;
  profileId?: string;
  message?: string;
}

export function BrandProfileReadinessCallout({
  variant,
  profileId,
  message,
}: BrandProfileReadinessCalloutProps) {
  const href =
    variant === 'missing-profile'
      ? brandIdentityHref({ tab: 'core-profile' })
      : brandIdentityHref({ tab: 'core-profile', profileId, section: 'pillars' });

  return (
    <AlertBanner tone="warning" role="status" className="px-3 py-2">
      {message ?? DEFAULT_MESSAGES[variant]}{' '}
      <Link to={href} className={pbWarningActionLinkClassName}>
        {ACTION_LABELS[variant]}
      </Link>
    </AlertBanner>
  );
}
