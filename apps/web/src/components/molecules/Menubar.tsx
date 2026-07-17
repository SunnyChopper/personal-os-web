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
  return (
    <div
      role="menubar"
      aria-label={ariaLabel}
      className={cn(
        'flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2 dark:border-gray-700',
        className
      )}
    >
      {menus.map((menu) => (
        <DropdownMenuButton key={menu.key} label={menu.label} items={menu.items} />
      ))}
    </div>
  );
}
