import { statusPillClassName } from '../personal-branding-ui';
import { cn } from '@/lib/utils';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';
import { daysSinceLastTouch, stalenessBadgeTone } from './rolodex-platform';

interface DaysSinceLastTouchBadgeProps {
  connection: Pick<CreatorConnection, 'lastInteractedAt' | 'followUpCadenceDays'>;
  className?: string;
}

export default function DaysSinceLastTouchBadge({
  connection,
  className,
}: DaysSinceLastTouchBadgeProps) {
  const days = daysSinceLastTouch(connection.lastInteractedAt);

  if (days === null) {
    return (
      <span
        className={cn(statusPillClassName('muted'), className)}
        title="Never interacted"
        aria-label="Never interacted"
      >
        Never touched
      </span>
    );
  }

  const tone = stalenessBadgeTone(days, connection.followUpCadenceDays);
  const label = `${days}d`;
  const description = `${days} day${days === 1 ? '' : 's'} since last touch`;

  return (
    <span
      className={cn(statusPillClassName(tone), className)}
      title={description}
      aria-label={description}
    >
      {label}
    </span>
  );
}
