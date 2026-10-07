export interface MonthGridDay {
  iso: string;
  inMonth: boolean;
}

export function isoBelongsToMonth(iso: string, year: number, month: number): boolean {
  const [y, m] = iso.split('-').map(Number);
  return y === year && m - 1 === month;
}

export function firstIsoOfMonth(year: number, month: number): string {
  const m = String(month + 1).padStart(2, '0');
  return `${year}-${m}-01`;
}

export function resolveSelectedDayForMonth(input: {
  year: number;
  month: number;
  todayIso: string;
  preferredIso?: string | null;
}): string {
  const { year, month, todayIso, preferredIso } = input;
  if (preferredIso && isoBelongsToMonth(preferredIso, year, month)) {
    return preferredIso;
  }
  if (isoBelongsToMonth(todayIso, year, month)) {
    return todayIso;
  }
  return firstIsoOfMonth(year, month);
}

/** Map event count to 0–3 density dots for calendar cells (0 = no mark). */
export function eventDayDensityDotCount(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

export function formatEventDayAriaLabel(iso: string, eventCount: number): string {
  if (eventCount <= 0) return iso;
  const noun = eventCount === 1 ? 'event' : 'events';
  return `${iso}, ${eventCount} ${noun}`;
}

export function buildMonthGrid(year: number, month: number): MonthGridDay[][] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const weeks: MonthGridDay[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w += 1) {
    const week: MonthGridDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      week.push({
        iso: `${y}-${m}-${day}`,
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
