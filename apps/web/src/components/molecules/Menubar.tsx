import { useRef, useState, type KeyboardEvent } from 'react';
import { nextMenubarIndex } from '@/lib/a11y/menu-keyboard';
import { cn } from '@/lib/utils';
import DropdownMenuButton, { type MenuItem } from './DropdownMenuButton';

export interface MenubarMenu {
  key: string;
  label: string;
  items: MenuItem[];
}

interface MenubarProps {
  menus: MenubarMenu[];
  ariaLabel: string;
  className?: string;
}

export default function Menubar({ menus, ariaLabel, className }: MenubarProps) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [focusedMenuIndex, setFocusedMenuIndex] = useState(0);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTriggerAt = (index: number, options?: { open?: boolean }) => {
    if (menus.length === 0) return;
    const clamped = ((index % menus.length) + menus.length) % menus.length;
    setFocusedMenuIndex(clamped);
    triggerRefs.current[clamped]?.focus();

    if (options?.open === true) {
      setOpenMenuKey(menus[clamped]!.key);
    } else if (options?.open === false) {
      setOpenMenuKey(null);
    }
  };

  const handleHorizontalNav = (key: 'ArrowLeft' | 'ArrowRight', fromIndex: number) => {
    const next = nextMenubarIndex(menus.length, fromIndex, key);
    if (next === null) return;
    const keepOpen = openMenuKey !== null;
    focusTriggerAt(next, { open: keepOpen });
  };

  const handleMenubarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') {
      return;
    }

    const next = nextMenubarIndex(menus.length, focusedMenuIndex, key);
    if (next === null) return;

    event.preventDefault();
    const keepOpen = openMenuKey !== null;
    focusTriggerAt(next, { open: keepOpen });
  };

  return (
    <div
      role="menubar"
      aria-label={ariaLabel}
      onKeyDown={handleMenubarKeyDown}
      className={cn(
        'flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2 dark:border-gray-700',
        className
      )}
    >
      {menus.map((menu, index) => (
        <DropdownMenuButton
          key={menu.key}
          label={menu.label}
          items={menu.items}
          open={openMenuKey === menu.key}
          onOpenChange={(open) => {
            if (open) {
              setOpenMenuKey(menu.key);
              setFocusedMenuIndex(index);
            } else if (openMenuKey === menu.key) {
              setOpenMenuKey(null);
            }
          }}
          triggerRole="menuitem"
          tabIndex={focusedMenuIndex === index ? 0 : -1}
          triggerRef={(node) => {
            triggerRefs.current[index] = node;
          }}
          onTriggerFocus={() => setFocusedMenuIndex(index)}
          onMenuKeyNav={(key) => handleHorizontalNav(key, index)}
        />
      ))}
    </div>
  );
}
