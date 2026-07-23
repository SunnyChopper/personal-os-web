import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import {
  linkAccentClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';

export interface UniversalRulesFallbackNoticeProps {
  platformLabel: string;
  className?: string;
}

export default function UniversalRulesFallbackNotice({
  platformLabel,
  className,
}: UniversalRulesFallbackNoticeProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-950/30',
        className
      )}
      role="note"
      aria-label={`Universal fallback for ${platformLabel}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={statusPillClassName('info')}>Universal fallback</span>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This profile has no mapped rules for {platformLabel}. Generation will use module-wide
          universal rules.{' '}
          <Link to={ROUTES.admin.personalBrandingBrandIdentity} className={linkAccentClassName}>
            Map this profile on the Platform Rules tab
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
