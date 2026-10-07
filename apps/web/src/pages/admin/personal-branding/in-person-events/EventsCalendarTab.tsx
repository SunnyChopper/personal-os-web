import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import {
  buildMonthGrid,
  eventDayDensityDotCount,
  formatEventDayAriaLabel,
} from '@/lib/date/month-grid';
import {
  calendarDayDetailStripClassName,
  eventsCalendarDensityDotClassName,
  eventsCalendarTodayButtonClassName,
  eventsCalendarTodayCellClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { cn } from '@/lib/utils';
import type { InPersonEvent } from '@/types/api/personal-branding.dto';
import {
  linkAccentClassName,
  pbDenseListStackClassName,
  pbFormLabelClassName,
  statusPillClassName,
  type StatusPillTone,
} from '../personal-branding-ui';

type Props = {
  events: ReturnType<typeof useInPersonEvents>;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function stripStatusPillTone(status: InPersonEvent['status']): StatusPillTone {
  switch (status) {
    case 'REGISTERED':
      return 'success';
    case 'INTERESTED':
      return 'info';
    case 'ATTENDED':
      return 'muted';
    default:
      return 'neutral';
  }
}

function cursorFromIso(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-').map(Number);
  return { year: y, month: m - 1 };
}

function formatSelectedDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function EventsCalendarTab({ events }: Props) {
  const today = events.operatorToday;
  const [cursor, setCursor] = useState(() => cursorFromIso(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayCursor = useMemo(() => cursorFromIso(today), [today]);
  const isViewingCurrentMonth =
    cursor.year === todayCursor.year && cursor.month === todayCursor.month;
  const isTodayAnchor = isViewingCurrentMonth && selectedDay === today;

  const jumpToToday = useCallback(() => {
    setCursor(todayCursor);
    setSelectedDay(today);
  }, [today, todayCursor]);

  const weeks = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, InPersonEvent[]>();
    for (const event of events.filteredAllEvents) {
      if (!event.startsAt) continue;
      const day = event.startsAt.slice(0, 10);
      const bucket = map.get(day) ?? [];
      bucket.push(event);
      map.set(day, bucket);
    }
    return map;
  }, [events.filteredAllEvents]);

  const activeStints = useMemo(() => {
    const rows = events.locations.data?.data ?? [];
    return rows.filter((stint) => stint.startDate <= today && stint.endDate >= today);
  }, [events.locations.data?.data, today]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const showDetailStrip = selectedDay != null && selectedEvents.length > 0;

  const handleDayClick = (day: { iso: string; inMonth: boolean }) => {
    if (day.inMonth) {
      setSelectedDay((current) => (current === day.iso ? null : day.iso));
      return;
    }
    const { year, month } = cursorFromIso(day.iso);
    setCursor({ year, month });
    setSelectedDay(day.iso);
  };

  return (
    <div className="space-y-4">
      {activeStints.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-gray-200">Where you are:</span>
          {activeStints.map((stint) => (
            <span
              key={stint.id}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-900"
            >
              {stint.label} · {stint.city}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Previous month"
          onClick={() => {
            const d = new Date(cursor.year, cursor.month - 1, 1);
            setCursor({ year: d.getFullYear(), month: d.getMonth() });
            setSelectedDay(null);
          }}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="flex-1 text-center text-lg font-medium text-gray-900 dark:text-white">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Next month"
            onClick={() => {
              const d = new Date(cursor.year, cursor.month + 1, 1);
              setCursor({ year: d.getFullYear(), month: d.getMonth() });
              setSelectedDay(null);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Jump to today"
            disabled={isTodayAnchor}
            onClick={jumpToToday}
            className={eventsCalendarTodayButtonClassName}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day) => {
          const dayEvents = eventsByDay.get(day.iso) ?? [];
          const densityDots = eventDayDensityDotCount(dayEvents.length);
          const isSelected = selectedDay === day.iso;
          const isToday = day.iso === today && day.inMonth;
          return (
            <button
              key={day.iso}
              type="button"
              aria-label={formatEventDayAriaLabel(day.iso, dayEvents.length)}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => handleDayClick(day)}
              className={cn(
                'min-h-20 rounded-lg border p-1 text-left transition',
                day.inMonth
                  ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                  : 'border-transparent bg-gray-50 text-gray-400 dark:bg-gray-950 dark:text-gray-600',
                isToday && !isSelected && eventsCalendarTodayCellClassName,
                isSelected && 'ring-2 ring-blue-500'
              )}
            >
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {Number(day.iso.slice(8, 10))}
              </div>
              {densityDots > 0 ? (
                <div
                  data-testid={`event-density-${day.iso}`}
                  aria-hidden="true"
                  className="pointer-events-none mt-1 flex justify-center gap-0.5"
                >
                  {Array.from({ length: densityDots }, (_, index) => (
                    <span key={index} className={eventsCalendarDensityDotClassName} />
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {showDetailStrip ? (
        <section className={calendarDayDetailStripClassName} aria-label="Selected day details">
          <time dateTime={selectedDay!} className={cn('block', pbFormLabelClassName)}>
            {formatSelectedDayLabel(selectedDay!)}
          </time>
          <ul className={pbDenseListStackClassName}>
            {selectedEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                <span className={statusPillClassName(stripStatusPillTone(event.status))}>
                  {event.status}
                </span>
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className={linkAccentClassName}
                  >
                    View / Register
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
