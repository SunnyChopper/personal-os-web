import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Menubar from '@/components/molecules/Menubar';

const menus = [
  {
    key: 'file',
    label: 'File',
    items: [
      { key: 'publish', label: 'Publish', onClick: vi.fn() },
      { key: 'delete', label: 'Delete', onClick: vi.fn() },
    ],
  },
  {
    key: 'ai-tools',
    label: 'AI Tools',
    items: [{ key: 'finish', label: 'Finish Content', onClick: vi.fn() }],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [{ key: 'pillars', label: 'Brand Pillars', badge: 2, onClick: vi.fn() }],
  },
];

describe('Menubar', () => {
  it('renders top-level menuitems with roving tabindex', () => {
    render(<Menubar menus={menus} ariaLabel="Content workbench actions" />);

    const file = screen.getByRole('menuitem', { name: 'File' });
    const aiTools = screen.getByRole('menuitem', { name: 'AI Tools' });
    const settings = screen.getByRole('menuitem', { name: 'Settings' });

    expect(file).toHaveAttribute('tabindex', '0');
    expect(aiTools).toHaveAttribute('tabindex', '-1');
    expect(settings).toHaveAttribute('tabindex', '-1');
    expect(file.className).toContain('focus-visible:ring-blue-500/40');
  });

  it('moves focus between menus with ArrowRight and ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Menubar menus={menus} ariaLabel="Content workbench actions" />);

    const file = screen.getByRole('menuitem', { name: 'File' });
    file.focus();

    await user.keyboard('{ArrowRight}');
    const aiTools = screen.getByRole('menuitem', { name: 'AI Tools' });
    expect(aiTools).toHaveFocus();
    expect(aiTools).toHaveAttribute('tabindex', '0');
    expect(file).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowLeft}');
    expect(file).toHaveFocus();
  });

  it('opens menu on Enter and moves to neighbor with ArrowRight while open', async () => {
    const user = userEvent.setup();
    render(<Menubar menus={menus} ariaLabel="Content workbench actions" />);

    const file = screen.getByRole('menuitem', { name: 'File' });
    file.focus();
    await user.keyboard('{Enter}');

    expect(file).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Publish' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    const aiTools = screen.getByRole('menuitem', { name: 'AI Tools' });
    expect(aiTools).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Finish Content' })).toHaveFocus();
    expect(file).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape and returns focus to the owning top-level menuitem', async () => {
    const user = userEvent.setup();
    render(<Menubar menus={menus} ariaLabel="Content workbench actions" />);

    const aiTools = screen.getByRole('menuitem', { name: 'AI Tools' });
    aiTools.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: 'Finish Content' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(aiTools).toHaveFocus();
  });
});
