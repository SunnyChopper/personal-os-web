import type { LogbookEntry } from '@/types/growth-system';

/**
 * Filters logbook entries based on a search query
 * Searches in title, notes, and date fields
 */
export function filterLogbookEntries(entries: LogbookEntry[], searchQuery: string): LogbookEntry[] {
  if (!searchQuery.trim()) {
    return entries;
  }

  const query = searchQuery.toLowerCase();
  return entries.filter((entry) => {
    const matchesTitle = entry.title?.toLowerCase().includes(query);
    const matchesNotes = entry.notes?.toLowerCase().includes(query);
    const matchesDate = entry.date.includes(query);

    return matchesTitle || matchesNotes || matchesDate;
  });
}

/**
 * Sorts logbook entries by date (newest first)
 */
export function sortLogbookEntriesByDate(entries: LogbookEntry[]): LogbookEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
