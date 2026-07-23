import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Dialog from '@/components/molecules/Dialog';
import { overlayBackdropClassName } from '@/lib/overlay-layer';

describe('Dialog', () => {
  it('portals open dialog to document.body with overlay backdrop z-index', () => {
    render(
      <Dialog isOpen onClose={vi.fn()} title="Test dialog">
        Dialog content
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(document.body.contains(dialog)).toBe(true);
    expect(screen.getByText('Dialog content')).toBeInTheDocument();

    const backdrop = Array.from(document.body.querySelectorAll('div')).find((el) =>
      el.className.includes(overlayBackdropClassName)
    );
    expect(backdrop).toBeDefined();
    expect(backdrop?.className).toContain('fixed inset-0');
  });

  it('does not render when closed', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()} title="Test dialog">
        Dialog content
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
