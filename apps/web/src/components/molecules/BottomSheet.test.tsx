import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import BottomSheet from '@/components/molecules/BottomSheet';
import { overlayBackdropClassName } from '@/lib/overlay-layer';

const useReducedMotion = vi.fn(() => false);

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => useReducedMotion(),
  };
});

describe('BottomSheet', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
  });

  it('portals open sheet to document.body with overlay backdrop z-index', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose} title="Test sheet">
        Sheet content
      </BottomSheet>
    );

    const backdrop = screen.getByRole('button', { name: 'Dismiss sheet' });
    expect(backdrop.className).toContain(overlayBackdropClassName);
    expect(document.body.contains(backdrop)).toBe(true);
    expect(screen.getAllByRole('dialog', { name: 'Test sheet' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sheet content').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render when closed', () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()} title="Test sheet">
        Sheet content
      </BottomSheet>
    );

    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose} title="Test sheet">
        Sheet content
      </BottomSheet>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss sheet' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose} title="Test sheet">
        Sheet content
      </BottomSheet>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom header when provided', () => {
    render(
      <BottomSheet
        isOpen
        onClose={vi.fn()}
        ariaLabel="Custom sheet"
        header={<div>Custom header</div>}
      >
        Sheet content
      </BottomSheet>
    );

    expect(screen.getByText('Custom header')).toBeInTheDocument();
    expect(screen.getAllByRole('dialog', { name: 'Custom sheet' }).length).toBeGreaterThanOrEqual(
      1
    );
  });

  it('renders side-drawer desktop panel when desktopPresentation is side-drawer', () => {
    render(
      <BottomSheet
        isOpen
        onClose={vi.fn()}
        ariaLabel="Side drawer"
        desktopPresentation="side-drawer"
        header={<div>Drawer header</div>}
      >
        Drawer content
      </BottomSheet>
    );

    const dialogs = screen.getAllByRole('dialog', { name: 'Side drawer' });
    expect(dialogs.length).toBe(2);

    const sideDrawer = dialogs.find((node) => node.tagName === 'ASIDE');
    expect(sideDrawer).toBeDefined();
    expect(sideDrawer?.className).toContain('max-w-md');
    expect(sideDrawer?.className).toContain('md:flex');
    expect(screen.getAllByText('Drawer content').length).toBeGreaterThanOrEqual(1);
  });

  it('applies snap point height styles on mobile sheet', () => {
    render(
      <BottomSheet
        isOpen
        onClose={vi.fn()}
        title="Snapping sheet"
        snapPoints={[0.55, 0.92]}
        initialSnapIndex={1}
      >
        Snapped content
      </BottomSheet>
    );

    const mobileDialog = screen.getAllByRole('dialog').find((node) => node.tagName === 'DIV');
    expect(mobileDialog).toBeDefined();
    expect(mobileDialog).toHaveStyle({ height: '92vh', maxHeight: '92vh' });
  });

  it('renders footer outside scrollable content when provided', () => {
    render(
      <BottomSheet
        isOpen
        onClose={vi.fn()}
        title="Footer sheet"
        footer={<button type="button">Footer action</button>}
      >
        Sheet content
      </BottomSheet>
    );

    const footers = screen.getAllByTestId('bottom-sheet-footer');
    expect(footers.length).toBeGreaterThanOrEqual(1);

    for (const footer of footers) {
      const footerButton = footer.querySelector('button');
      expect(footerButton).toHaveTextContent('Footer action');
      const scrollParent = footer.previousElementSibling;
      expect(scrollParent?.className).toContain('overflow-y-auto');
      expect(scrollParent?.textContent).toContain('Sheet content');
    }
  });
});
