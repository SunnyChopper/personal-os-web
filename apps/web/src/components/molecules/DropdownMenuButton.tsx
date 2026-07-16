import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}

interface DropdownMenuButtonProps {
  label: string;
  items: MenuItem[];
  className?: string;
}

export default function DropdownMenuButton({ label, items, className }: DropdownMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'rounded px-2.5 py-1 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        {label}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isDanger = item.tone === 'danger';

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50',
                  isDanger
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {Icon ? <Icon size={14} className="shrink-0" /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
