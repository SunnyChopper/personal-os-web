import { describe, expect, it, vi } from 'vitest';
import { countTaskListItems, toggleTaskListItemAt } from '@/lib/markdown/task-list-toggle';

describe('countTaskListItems', () => {
  it('counts task-list items across bullet styles and indentation', () => {
    const source = [
      '- [ ] top level',
      '  - [x] nested',
      '* [ ] asterisk',
      '+ [X] plus checked',
    ].join('\n');
    expect(countTaskListItems(source)).toBe(4);
  });

  it('returns 0 when no task-list items exist', () => {
    expect(countTaskListItems('- plain bullet\n1. ordered')).toBe(0);
  });
});

describe('toggleTaskListItemAt', () => {
  it('checks an unchecked item at the given index', () => {
    const source = '- [ ] first\n- [ ] second';
    expect(toggleTaskListItemAt(source, 1, true)).toBe('- [ ] first\n- [x] second');
  });

  it('unchecks a checked item', () => {
    const source = '- [x] done';
    expect(toggleTaskListItemAt(source, 0, false)).toBe('- [ ] done');
  });

  it('is idempotent when already at desired state', () => {
    const source = '- [x] done';
    expect(toggleTaskListItemAt(source, 0, true)).toBe(source);
  });

  it('handles CRLF line endings', () => {
    const source = '- [ ] one\r\n- [ ] two';
    expect(toggleTaskListItemAt(source, 1, true)).toBe('- [ ] one\r\n- [x] two');
  });

  it('handles mixed indentation and [X] casing', () => {
    const source = '  - [X] nested';
    expect(toggleTaskListItemAt(source, 0, false)).toBe('  - [ ] nested');
  });

  it('returns source unchanged for out-of-range index', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const source = '- [ ] only';
    expect(toggleTaskListItemAt(source, 3, true)).toBe(source);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('leaves non-target items unchanged', () => {
    const source = ['# Heading', '- [ ] step 1', '- regular bullet', '- [ ] step 2'].join('\n');
    expect(toggleTaskListItemAt(source, 1, true)).toBe(
      ['# Heading', '- [ ] step 1', '- regular bullet', '- [x] step 2'].join('\n')
    );
  });
});
