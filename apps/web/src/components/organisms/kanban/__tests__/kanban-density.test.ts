import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  KANBAN_BACKLOG_DENSITY_STORAGE_KEY,
  KANBAN_CARD_DENSITY_STORAGE_KEY,
} from '@/components/organisms/kanban/kanban-constants';
import {
  persistKanbanCardDensity,
  readKanbanCardDensity,
} from '@/components/organisms/kanban/kanban-density';

describe('kanban-density', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to expanded cards when nothing is stored', () => {
    expect(readKanbanCardDensity()).toBe('cards');
  });

  it('reads and persists the board-wide key', () => {
    persistKanbanCardDensity('compact');
    expect(localStorage.getItem(KANBAN_CARD_DENSITY_STORAGE_KEY)).toBe('compact');
    expect(readKanbanCardDensity()).toBe('compact');
  });

  it('migrates legacy backlog-only key when board key is absent', () => {
    localStorage.setItem(KANBAN_BACKLOG_DENSITY_STORAGE_KEY, 'compact');
    expect(readKanbanCardDensity()).toBe('compact');
  });

  it('prefers board key over legacy backlog key', () => {
    localStorage.setItem(KANBAN_BACKLOG_DENSITY_STORAGE_KEY, 'compact');
    localStorage.setItem(KANBAN_CARD_DENSITY_STORAGE_KEY, 'cards');
    expect(readKanbanCardDensity()).toBe('cards');
  });
});
