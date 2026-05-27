import {
  KANBAN_BACKLOG_DENSITY_STORAGE_KEY,
  KANBAN_CARD_DENSITY_STORAGE_KEY,
  type KanbanCardDensity,
} from '@/components/organisms/kanban/kanban-constants';

function parseDensity(value: string | null): KanbanCardDensity | null {
  if (value === 'compact' || value === 'cards') {
    return value;
  }
  return null;
}

/** Read persisted board density; migrates legacy Backlog-only key when needed. */
export function readKanbanCardDensity(): KanbanCardDensity {
  try {
    const current = parseDensity(localStorage.getItem(KANBAN_CARD_DENSITY_STORAGE_KEY));
    if (current) {
      return current;
    }
    const legacy = parseDensity(localStorage.getItem(KANBAN_BACKLOG_DENSITY_STORAGE_KEY));
    if (legacy) {
      return legacy;
    }
  } catch {
    /* private mode / quota */
  }
  return 'cards';
}

export function persistKanbanCardDensity(density: KanbanCardDensity): void {
  try {
    localStorage.setItem(KANBAN_CARD_DENSITY_STORAGE_KEY, density);
  } catch {
    /* ignore quota / private mode */
  }
}
