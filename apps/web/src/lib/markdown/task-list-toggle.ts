/** GFM task-list line opener: `- [ ]`, `* [x]`, indented variants, etc. */
const TASK_LIST_ITEM_REGEX = /^(\s*[-*+]\s+)\[( |x|X)\]/gm;

/**
 * Count GFM task-list items in a markdown source string.
 */
export function countTaskListItems(source: string): number {
  const matches = source.match(TASK_LIST_ITEM_REGEX);
  return matches?.length ?? 0;
}

/**
 * Toggle the checked state of the Nth task-list item (0-based) in `source`.
 * Returns the original string when index is out of range or already at desired state.
 */
export function toggleTaskListItemAt(source: string, index: number, nextChecked: boolean): string {
  if (index < 0) {
    console.warn('[task-list-toggle] Out-of-range index:', index);
    return source;
  }

  const regex = new RegExp(TASK_LIST_ITEM_REGEX.source, 'gm');
  let match: RegExpExecArray | null;
  let currentIndex = 0;

  while ((match = regex.exec(source)) !== null) {
    if (currentIndex === index) {
      const currentChecked = match[2].toLowerCase() === 'x';
      if (currentChecked === nextChecked) {
        return source;
      }
      const marker = nextChecked ? 'x' : ' ';
      const replacement = `${match[1]}[${marker}]`;
      return (
        source.slice(0, match.index) + replacement + source.slice(match.index + match[0].length)
      );
    }
    currentIndex += 1;
  }

  console.warn('[task-list-toggle] Out-of-range index:', index);
  return source;
}
