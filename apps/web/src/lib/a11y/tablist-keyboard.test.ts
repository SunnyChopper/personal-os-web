import { describe, expect, it } from 'vitest';

import { focusTabPanelContent, nextTabIndex } from './tablist-keyboard';

describe('nextTabIndex', () => {
  it('wraps ArrowRight and ArrowLeft', () => {
    expect(nextTabIndex(5, 0, 'ArrowRight')).toBe(1);
    expect(nextTabIndex(5, 4, 'ArrowRight')).toBe(0);
    expect(nextTabIndex(5, 0, 'ArrowLeft')).toBe(4);
    expect(nextTabIndex(5, 2, 'ArrowLeft')).toBe(1);
  });

  it('jumps to Home and End', () => {
    expect(nextTabIndex(5, 3, 'Home')).toBe(0);
    expect(nextTabIndex(5, 1, 'End')).toBe(4);
  });

  it('returns null for unhandled keys', () => {
    expect(nextTabIndex(5, 2, 'Tab')).toBeNull();
    expect(nextTabIndex(5, 2, 'Enter')).toBeNull();
  });

  it('returns null when count is zero', () => {
    expect(nextTabIndex(0, 0, 'ArrowRight')).toBeNull();
  });
});

describe('focusTabPanelContent', () => {
  it('prefers the first heading', () => {
    const panel = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = 'Section';
    const button = document.createElement('button');
    button.textContent = 'Action';
    panel.append(heading, button);
    document.body.append(panel);

    const focused = focusTabPanelContent(panel);
    expect(focused).toBe(heading);
    expect(document.activeElement).toBe(heading);
    expect(heading.tabIndex).toBe(-1);

    panel.remove();
  });

  it('falls back to the first focusable control', () => {
    const panel = document.createElement('div');
    const button = document.createElement('button');
    button.textContent = 'Action';
    panel.append(button);
    document.body.append(panel);

    const focused = focusTabPanelContent(panel);
    expect(focused).toBe(button);
    expect(document.activeElement).toBe(button);

    panel.remove();
  });

  it('focuses the panel when no heading or focusable exists', () => {
    const panel = document.createElement('div');
    panel.tabIndex = -1;
    document.body.append(panel);

    const focused = focusTabPanelContent(panel);
    expect(focused).toBe(panel);
    expect(document.activeElement).toBe(panel);

    panel.remove();
  });

  it('skips headings inside hidden or inert subtrees', () => {
    const panel = document.createElement('div');
    const hiddenWrap = document.createElement('div');
    hiddenWrap.hidden = true;
    const hiddenHeading = document.createElement('h2');
    hiddenHeading.textContent = 'Hidden';
    const visibleHeading = document.createElement('h3');
    visibleHeading.textContent = 'Visible';
    hiddenWrap.append(hiddenHeading);
    panel.append(hiddenWrap, visibleHeading);
    document.body.append(panel);

    const focused = focusTabPanelContent(panel);
    expect(focused).toBe(visibleHeading);
    expect(document.activeElement).toBe(visibleHeading);

    panel.remove();
  });
});
