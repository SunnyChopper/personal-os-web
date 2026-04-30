import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, FileEdit, Trash2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEditTags?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onOpenReaderMode?: () => void;
}

export default function FileContextMenu({
  x,
  y,
  onClose,
  onEditTags,
  onRename,
  onDelete,
  onOpenReaderMode,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const justOpenedRef = useRef(true);

  useEffect(() => {
    // Reset the just-opened flag after a delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      justOpenedRef.current = false;
    }, 300);

    const handleClickOutside = (event: MouseEvent) => {
      // Ignore right-click events (button 2) - these are handled by contextmenu
      if (event.button === 2) {
        return;
      }

      // Don't close if menu was just opened (prevents immediate closing)
      if (justOpenedRef.current) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Also handle contextmenu events to prevent closing when right-clicking elsewhere
    const handleContextMenu = (event: MouseEvent) => {
      // If right-clicking outside the menu, close it
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Adjust position if menu would go off screen
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = x;
        let newY = y;

        // Ensure menu doesn't go off right edge
        if (x + rect.width > viewportWidth) {
          newX = Math.max(10, viewportWidth - rect.width - 10);
        }
        // Ensure menu doesn't go off left edge
        if (newX < 0) {
          newX = 10;
        }
        // Ensure menu doesn't go off bottom edge
        if (y + rect.height > viewportHeight) {
          newY = Math.max(10, viewportHeight - rect.height - 10);
        }
        // Ensure menu doesn't go off top edge
        if (newY < 0) {
          newY = 10;
        }

        setPosition({ x: newX, y: newY });
      }
    });

    // Add listeners after a delay to prevent immediate closing from right-click mousedown
    // Use click event instead of mousedown to avoid right-click interference
    const listenerTimeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('contextmenu', handleContextMenu, true);
      document.addEventListener('keydown', handleEscape);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(listenerTimeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [x, y, onClose]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="menu"
    >
      {onOpenReaderMode && (
        <button
          onClick={() => {
            onOpenReaderMode();
            onClose();
          }}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
            'hover:bg-gray-100 dark:hover:bg-gray-700 transition',
            'text-gray-700 dark:text-gray-300'
          )}
          role="menuitem"
        >
          <BookOpen size={14} />
          <span>Open in Reader Mode</span>
        </button>
      )}
      {onOpenReaderMode && (onEditTags || onRename || onDelete) && (
        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
      )}
      {onEditTags && (
        <button
          onClick={() => {
            onEditTags();
            onClose();
          }}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
            'hover:bg-gray-100 dark:hover:bg-gray-700 transition',
            'text-gray-700 dark:text-gray-300'
          )}
          role="menuitem"
        >
          <Tag size={14} />
          <span>Edit Tags & Category</span>
        </button>
      )}
      {onRename && (
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
            'hover:bg-gray-100 dark:hover:bg-gray-700 transition',
            'text-gray-700 dark:text-gray-300'
          )}
          role="menuitem"
        >
          <FileEdit size={14} />
          <span>Rename</span>
        </button>
      )}
      {onDelete && (
        <>
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
              'hover:bg-red-50 dark:hover:bg-red-900/20 transition',
              'text-red-600 dark:text-red-400'
            )}
            role="menuitem"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );

  // Render via portal to ensure it's not clipped by parent containers
  return createPortal(menuContent, document.body);
}
