import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import { overlayBackdropClassName } from '@/lib/overlay-layer';

describe('SlideDrawer', () => {
  it('portals open drawer to document.body with overlay backdrop z-index', () => {
    const onClose = vi.fn();
    render(
      <SlideDrawer open onClose={onClose} ariaLabel="Test drawer" title="Test">
        Drawer content
      </SlideDrawer>
    );

    const backdrop = screen.getByRole('button', { name: 'Close Test drawer' });
    expect(backdrop.className).toContain(overlayBackdropClassName);
    expect(document.body.contains(backdrop)).toBe(true);

    expect(screen.getByRole('dialog', { name: 'Test drawer' })).toBeInTheDocument();
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SlideDrawer open={false} onClose={vi.fn()} ariaLabel="Test drawer" title="Test">
        Drawer content
      </SlideDrawer>
    );

    expect(screen.queryByRole('dialog', { name: 'Test drawer' })).not.toBeInTheDocument();
  });
});
