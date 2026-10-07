import { describe, expect, it } from 'vitest';

import {
  enabledIndices,
  firstEnabledIndex,
  lastEnabledIndex,
  nextEnabledMenuItemIndex,
  nextMenubarIndex,
} from './menu-keyboard';

describe('enabledIndices', () => {
  it('returns only enabled indices', () => {
    const isEnabled = (i: number) => i !== 1;
    expect(enabledIndices(4, isEnabled)).toEqual([0, 2, 3]);
  });
});

describe('firstEnabledIndex / lastEnabledIndex', () => {
  const isEnabled = (i: number) => i >= 1;

  it('skips leading disabled items', () => {
    expect(firstEnabledIndex(3, isEnabled)).toBe(1);
  });

  it('returns last enabled', () => {
    expect(lastEnabledIndex(3, isEnabled)).toBe(2);
  });

  it('returns -1 when none enabled', () => {
    expect(firstEnabledIndex(2, () => false)).toBe(-1);
    expect(lastEnabledIndex(2, () => false)).toBe(-1);
  });
});

describe('nextEnabledMenuItemIndex', () => {
  const isEnabled = (i: number) => i !== 1;

  it('wraps ArrowDown and ArrowUp over enabled items only', () => {
    expect(nextEnabledMenuItemIndex(4, 0, 'ArrowDown', isEnabled)).toBe(2);
    expect(nextEnabledMenuItemIndex(4, 2, 'ArrowDown', isEnabled)).toBe(3);
    expect(nextEnabledMenuItemIndex(4, 3, 'ArrowDown', isEnabled)).toBe(0);
    expect(nextEnabledMenuItemIndex(4, 3, 'ArrowUp', isEnabled)).toBe(2);
    expect(nextEnabledMenuItemIndex(4, 0, 'ArrowUp', isEnabled)).toBe(3);
  });

  it('jumps to Home and End among enabled items', () => {
    expect(nextEnabledMenuItemIndex(4, 3, 'Home', isEnabled)).toBe(0);
    expect(nextEnabledMenuItemIndex(4, 0, 'End', isEnabled)).toBe(3);
  });

  it('starts ArrowDown from first enabled when current is disabled', () => {
    expect(nextEnabledMenuItemIndex(4, 1, 'ArrowDown', isEnabled)).toBe(2);
  });

  it('returns null for unhandled keys or empty menus', () => {
    expect(nextEnabledMenuItemIndex(4, 0, 'Tab', isEnabled)).toBeNull();
    expect(nextEnabledMenuItemIndex(0, 0, 'ArrowDown', isEnabled)).toBeNull();
    expect(nextEnabledMenuItemIndex(2, 0, 'ArrowDown', () => false)).toBeNull();
  });
});

describe('nextMenubarIndex', () => {
  it('wraps horizontal navigation', () => {
    expect(nextMenubarIndex(3, 0, 'ArrowRight')).toBe(1);
    expect(nextMenubarIndex(3, 2, 'ArrowRight')).toBe(0);
    expect(nextMenubarIndex(3, 0, 'ArrowLeft')).toBe(2);
  });
});
