import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import DropdownMenuButton from '@/components/molecules/DropdownMenuButton';

describe('DropdownMenuButton', () => {
  it('opens menu on icon trigger click and sets aria-expanded', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton
        icon={MoreHorizontal}
        ariaLabel="Project options"
        items={[
          { key: 'edit', label: 'Edit', icon: Edit2, onClick: vi.fn() },
          { key: 'delete', label: 'Delete', icon: Trash2, onClick: vi.fn(), tone: 'danger' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Project options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.className).toContain('focus-visible:ring-blue-500/40');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('invokes item callbacks and closes menu', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <DropdownMenuButton
        icon={MoreHorizontal}
        ariaLabel="Project options"
        items={[
          { key: 'edit', label: 'Edit', onClick: onEdit },
          { key: 'delete', label: 'Delete', onClick: onDelete, tone: 'danger' },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Project options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Project options' }));
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(deleteItem).toHaveClass('text-red-600');
    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders optional badge on menu items', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton
        label="Settings"
        items={[{ key: 'pillars', label: 'Brand Pillars', badge: 3, onClick: vi.fn() }]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const item = screen.getByRole('menuitem', { name: 'Brand Pillars' });
    expect(item).toBeInTheDocument();
    expect(item).toHaveTextContent('3');
  });

  it('aligns menu to the end when align is end', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton
        label="Actions"
        align="end"
        items={[{ key: 'one', label: 'One', onClick: vi.fn() }]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    expect(menu.className).toContain('right-0');
  });

  it('opens and focuses first item on ArrowDown from closed trigger', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton
        label="File"
        items={[
          { key: 'save', label: 'Save', onClick: vi.fn() },
          { key: 'delete', label: 'Delete', onClick: vi.fn() },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'File' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();
  });

  it('moves focus between items with ArrowDown and ArrowUp, skipping disabled', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton
        label="File"
        items={[
          { key: 'save', label: 'Save', onClick: vi.fn() },
          { key: 'noop', label: 'Noop', onClick: vi.fn(), disabled: true },
          { key: 'delete', label: 'Delete', onClick: vi.fn() },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'File' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const save = screen.getByRole('menuitem', { name: 'Save' });
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(save).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(deleteItem).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(save).toHaveFocus();
  });

  it('closes on Escape and returns focus to trigger', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenuButton label="File" items={[{ key: 'save', label: 'Save', onClick: vi.fn() }]} />
    );

    const trigger = screen.getByRole('button', { name: 'File' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('activates focused item with Enter and closes menu', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <DropdownMenuButton
        label="File"
        items={[
          { key: 'save', label: 'Save', onClick: onSave },
          { key: 'delete', label: 'Delete', onClick: vi.fn() },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'File' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('tolerates unstable items array identity while closed', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <DropdownMenuButton label="File" items={[{ key: 'save', label: 'Save', onClick }]} />
    );

    for (let i = 0; i < 20; i++) {
      rerender(
        <DropdownMenuButton label="File" items={[{ key: 'save', label: 'Save', onClick }]} />
      );
    }

    expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('tolerates unstable items array identity while open', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <DropdownMenuButton
        label="File"
        items={[
          { key: 'save', label: 'Save', onClick: onSave },
          { key: 'delete', label: 'Delete', onClick: onDelete },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'File' });
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();

    for (let i = 0; i < 10; i++) {
      rerender(
        <DropdownMenuButton
          label="File"
          items={[
            { key: 'save', label: 'Save', onClick: onSave },
            { key: 'delete', label: 'Delete', onClick: onDelete },
          ]}
        />
      );
    }

    expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders menu through portal when portal prop is true', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <DropdownMenuButton
        portal
        label="Actions"
        items={[{ key: 'save', label: 'Save', onClick: onSave }]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);

    const item = screen.getByRole('menuitem', { name: 'Save' });
    expect(item).toBeInTheDocument();

    await user.click(item);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
