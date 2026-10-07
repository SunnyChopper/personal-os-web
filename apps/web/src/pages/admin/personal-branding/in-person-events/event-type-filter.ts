import type { InPersonEventType } from '@/types/api/personal-branding.dto';

export const EVENT_TYPE_OPTIONS: { value: InPersonEventType; label: string }[] = [
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'talk', label: 'Talk' },
  { value: 'other', label: 'Other' },
];

export function isAllEventTypes(current: InPersonEventType[]): boolean {
  return current.length === 0;
}

export function toggleEventTypeFilter(
  current: InPersonEventType[],
  clicked: 'all' | InPersonEventType
): InPersonEventType[] {
  if (clicked === 'all') {
    return [];
  }
  if (current.includes(clicked)) {
    const next = current.filter((value) => value !== clicked);
    return next.length === 0 ? [] : next;
  }
  if (current.length === 0) {
    return [clicked];
  }
  return [...current, clicked];
}
