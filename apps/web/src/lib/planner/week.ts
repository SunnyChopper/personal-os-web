/** Monday (YYYY-MM-DD) of the calendar week containing `d` (local). */

export function mondayISO(d: Date): string {
  const day = d.getDay(); // 0 Sun … 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + offset);
  return mon.toISOString().slice(0, 10);
}

export function addDaysISO(isoDate: string, days: number): string {
  const [y, m, day] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function todayISOLocal(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Preserve time portion of an ISO datetime; replace calendar date. */
export function withCalendarDate(isoDateTime: string, newDateYYYYMMDD: string): string {
  const timePart = isoDateTime.includes('T') ? isoDateTime.split('T')[1] : '09:00:00';
  return `${newDateYYYYMMDD}T${timePart}`;
}
