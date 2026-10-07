import { nextTabIndex } from './tablist-keyboard';

/** Collect indices where `isEnabled(i)` is true. */
export function enabledIndices(count: number, isEnabled: (index: number) => boolean): number[] {
  const indices: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (isEnabled(i)) indices.push(i);
  }
  return indices;
}

/** First enabled index, or -1 when none. */
export function firstEnabledIndex(count: number, isEnabled: (index: number) => boolean): number {
  const indices = enabledIndices(count, isEnabled);
  return indices.length > 0 ? indices[0]! : -1;
}

/** Last enabled index, or -1 when none. */
export function lastEnabledIndex(count: number, isEnabled: (index: number) => boolean): number {
  const indices = enabledIndices(count, isEnabled);
  return indices.length > 0 ? indices[indices.length - 1]! : -1;
}

/**
 * Next focus index among enabled menu items for ArrowUp/Down/Home/End.
 * `current` is the item index (may be disabled); returns null when key is not handled.
 */
export function nextEnabledMenuItemIndex(
  count: number,
  current: number,
  key: string,
  isEnabled: (index: number) => boolean
): number | null {
  if (count <= 0) return null;

  const enabled = enabledIndices(count, isEnabled);
  if (enabled.length === 0) return null;

  switch (key) {
    case 'Home':
      return enabled[0]!;
    case 'End':
      return enabled[enabled.length - 1]!;
    case 'ArrowDown':
    case 'ArrowUp': {
      const pos = enabled.indexOf(current);
      if (pos >= 0) {
        const delta = key === 'ArrowDown' ? 1 : -1;
        const nextPos = (pos + delta + enabled.length) % enabled.length;
        return enabled[nextPos]!;
      }
      if (key === 'ArrowDown') {
        const after = enabled.find((index) => index > current);
        return after ?? enabled[0]!;
      }
      const before = [...enabled].reverse().find((index) => index < current);
      return before ?? enabled[enabled.length - 1]!;
    }
    default:
      return null;
  }
}

/** Horizontal menubar index math — delegates to tablist helper. */
export function nextMenubarIndex(count: number, current: number, key: string): number | null {
  return nextTabIndex(count, current, key);
}
