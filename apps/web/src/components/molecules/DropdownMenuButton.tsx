import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import { FLOATING_MENU_Z } from '@/lib/overlay-layer';
import { firstEnabledIndex, nextEnabledMenuItemIndex } from '@/lib/a11y/menu-keyboard';
import { pbFocusVisibleRingClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';

export interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  /** Optional trailing count pill (e.g. selected brand pillars). */
  badge?: number | string;
}

interface DropdownMenuButtonProps {
  label?: string;
  items: MenuItem[];
  className?: string;
  icon?: LucideIcon;
  ariaLabel?: string;
  align?: 'start' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerRole?: 'button' | 'menuitem';
  tabIndex?: number;
  onMenuKeyNav?: (key: 'ArrowLeft' | 'ArrowRight') => void;
  triggerRef?: Ref<HTMLButtonElement>;
  onTriggerFocus?: () => void;
  portal?: boolean;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export default function DropdownMenuButton({
  label,
  items,
  className,
  icon: TriggerIcon,
  ariaLabel,
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  triggerRole = 'button',
  tabIndex,
  onMenuKeyNav,
  triggerRef,
  onTriggerFocus,
  portal = false,
}: DropdownMenuButtonProps) {
  const menuId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wasOpenRef = useRef(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);
  const isIconTrigger = Boolean(TriggerIcon);
  const isMenubarTrigger = triggerRole === 'menuitem';

  const updateMenuCoords = () => {
    if (!internalTriggerRef.current) return;
    const r = internalTriggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - 8;
    const preferBelow = spaceBelow >= 160 || spaceBelow >= r.top;
    const top = preferBelow ? r.bottom + 4 : Math.max(8, r.top - 180);
    setMenuCoords({
      top,
      ...(align === 'end'
        ? { right: Math.max(8, window.innerWidth - r.right) }
        : { left: Math.max(8, r.left) }),
    });
  };

  useLayoutEffect(() => {
    if (!portal || !isOpen) {
      setMenuCoords(null);
      return;
    }
    updateMenuCoords();
  }, [portal, isOpen, align]);

  useEffect(() => {
    if (!portal || !isOpen) return;
    const onScrollOrResize = () => updateMenuCoords();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [portal, isOpen]);

  const focusTrigger = () => {
    internalTriggerRef.current?.focus();
  };

  const closeAndFocusTrigger = () => {
    setOpen(false);
    focusTrigger();
  };

  const isItemEnabled = (index: number) => !items[index]?.disabled;

  const focusItemAt = (index: number) => {
    if (index < 0 || index >= items.length || !isItemEnabled(index)) return;
    itemRefs.current[index]?.focus();
    setFocusedItemIndex(index);
  };

  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!wasOpen && isOpen) {
      const first = firstEnabledIndex(items.length, isItemEnabled);
      if (first >= 0) {
        focusItemAt(first);
      }
      return;
    }

    if (wasOpen && !isOpen) {
      setFocusedItemIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      const wasOpen = isOpen;
      setOpen(false);
      if (wasOpen && isMenubarTrigger) {
        focusTrigger();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        closeAndFocusTrigger();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen, isMenubarTrigger]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    closeAndFocusTrigger();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { key } = event;

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (onMenuKeyNav) {
        event.preventDefault();
        event.stopPropagation();
        onMenuKeyNav(key);
      }
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeAndFocusTrigger();
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      const index =
        focusedItemIndex >= 0 ? focusedItemIndex : firstEnabledIndex(items.length, isItemEnabled);
      const item = index >= 0 ? items[index] : undefined;
      if (item && !item.disabled) {
        handleItemClick(item);
      }
      return;
    }

    const current =
      focusedItemIndex >= 0 ? focusedItemIndex : firstEnabledIndex(items.length, isItemEnabled);
    const next = nextEnabledMenuItemIndex(items.length, current, key, isItemEnabled);
    if (next !== null) {
      event.preventDefault();
      focusItemAt(next);
    }
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;

    if ((key === 'ArrowDown' || key === 'Enter' || key === ' ') && !isOpen) {
      if (key === 'ArrowDown' || isMenubarTrigger) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (key === 'Escape' && isOpen) {
      event.preventDefault();
      closeAndFocusTrigger();
      return;
    }

    if ((key === 'ArrowLeft' || key === 'ArrowRight') && !isOpen && onMenuKeyNav) {
      event.preventDefault();
      onMenuKeyNav(key);
    }
  };

  const setTriggerNode = (node: HTMLButtonElement | null) => {
    internalTriggerRef.current = node;
    assignRef(triggerRef, node);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        ref={setTriggerNode}
        type="button"
        role={triggerRole}
        tabIndex={tabIndex}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        onFocus={onTriggerFocus}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={isIconTrigger ? ariaLabel : isMenubarTrigger ? label : undefined}
        className={cn(
          isIconTrigger
            ? 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            : 'rounded px-2.5 py-1 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
          pbFocusVisibleRingClassName,
          isOpen &&
            (isIconTrigger ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800')
        )}
      >
        {isIconTrigger && TriggerIcon ? <TriggerIcon size={20} aria-hidden /> : label}
      </button>

      {isOpen
        ? (() => {
            const menuContent = (
              <div
                id={menuId}
                ref={menuRef}
                role="menu"
                onKeyDown={handleMenuKeyDown}
                style={
                  portal && menuCoords
                    ? {
                        position: 'fixed',
                        top: menuCoords.top,
                        left: menuCoords.left,
                        right: menuCoords.right,
                        zIndex: FLOATING_MENU_Z,
                      }
                    : undefined
                }
                className={cn(
                  'min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800',
                  portal
                    ? ''
                    : cn('absolute top-full z-50 mt-1', align === 'end' ? 'right-0' : 'left-0')
                )}
              >
                {items.map((item, index) => {
                  const Icon = item.icon;
                  const isDanger = item.tone === 'danger';

                  return (
                    <button
                      key={item.key}
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      tabIndex={-1}
                      onClick={() => handleItemClick(item)}
                      onFocus={() => setFocusedItemIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50',
                        pbFocusVisibleRingClassName,
                        isDanger
                          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      )}
                    >
                      {Icon ? <Icon size={14} className="shrink-0" /> : null}
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {item.badge != null ? (
                        <span
                          className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          aria-hidden
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );

            return portal ? <OverlayPortal>{menuContent}</OverlayPortal> : menuContent;
          })()
        : null}
    </div>
  );
}
