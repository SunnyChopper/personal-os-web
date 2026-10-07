const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isInHiddenSubtree(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    if (current instanceof HTMLElement) {
      if (current.hidden || current.inert) {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}

/** Next tab index for ArrowLeft/Right (wrap), Home, End; null when key is not handled. */
export function nextTabIndex(count: number, current: number, key: string): number | null {
  if (count <= 0) return null;

  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Focus first heading, else first focusable control, else the panel itself. */
export function focusTabPanelContent(panel: HTMLElement): HTMLElement {
  const headings = panel.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const heading of headings) {
    if (heading instanceof HTMLElement && !isInHiddenSubtree(heading)) {
      if (!heading.hasAttribute('tabindex')) {
        heading.tabIndex = -1;
      }
      heading.focus();
      return heading;
    }
  }

  const focusables = panel.querySelectorAll(FOCUSABLE_SELECTOR);
  for (const focusable of focusables) {
    if (focusable instanceof HTMLElement && !isInHiddenSubtree(focusable)) {
      focusable.focus();
      return focusable;
    }
  }

  panel.focus();
  return panel;
}
