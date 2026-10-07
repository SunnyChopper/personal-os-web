import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  motion,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { X } from 'lucide-react';
import OverlayPortal from '@/components/molecules/OverlayPortal';
import { overlayBackdropClassName, overlaySurfaceClassName } from '@/lib/overlay-layer';
import { cn } from '@/lib/utils';

export type BottomSheetDesktopPresentation = 'centered-modal' | 'side-drawer';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxHeight?: string;
  showDragHandle?: boolean;
  desktopPresentation?: BottomSheetDesktopPresentation;
  snapPoints?: number[];
  initialSnapIndex?: number;
}

const DISMISS_DRAG_OFFSET_PX = 100;
const DISMISS_VELOCITY_Y = 500;
const SNAP_DRAG_THRESHOLD_PX = 48;

function resolveInitialSnapIndex(
  snapPoints: number[] | undefined,
  initialSnapIndex: number | undefined
): number {
  if (!snapPoints?.length) return 0;
  if (initialSnapIndex == null) return snapPoints.length - 1;
  return Math.min(Math.max(initialSnapIndex, 0), snapPoints.length - 1);
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  header,
  footer,
  ariaLabel,
  children,
  className,
  contentClassName,
  maxHeight = '90vh',
  showDragHandle = true,
  desktopPresentation = 'centered-modal',
  snapPoints,
  initialSnapIndex,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [activeSnapIndex, setActiveSnapIndex] = useState(() =>
    resolveInitialSnapIndex(snapPoints, initialSnapIndex)
  );

  const hasSnapPoints = Boolean(snapPoints?.length);
  const activeSnapFraction = hasSnapPoints
    ? (snapPoints?.[activeSnapIndex] ?? snapPoints?.[snapPoints.length - 1] ?? 0.9)
    : null;

  useEffect(() => {
    if (!isOpen) return;
    setActiveSnapIndex(resolveInitialSnapIndex(snapPoints, initialSnapIndex));
  }, [isOpen, snapPoints, initialSnapIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMobileDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!hasSnapPoints || !snapPoints?.length) {
        if (info.offset.y > DISMISS_DRAG_OFFSET_PX || info.velocity.y > DISMISS_VELOCITY_Y) {
          onClose();
        }
        return;
      }

      const draggedDown =
        info.offset.y > DISMISS_DRAG_OFFSET_PX || info.velocity.y > DISMISS_VELOCITY_Y;

      if (draggedDown) {
        if (activeSnapIndex > 0) {
          setActiveSnapIndex(activeSnapIndex - 1);
          return;
        }
        onClose();
        return;
      }

      if (info.offset.y > SNAP_DRAG_THRESHOLD_PX && activeSnapIndex < snapPoints.length - 1) {
        setActiveSnapIndex(activeSnapIndex + 1);
        return;
      }

      if (info.offset.y < -SNAP_DRAG_THRESHOLD_PX && activeSnapIndex > 0) {
        setActiveSnapIndex(activeSnapIndex - 1);
      }
    },
    [activeSnapIndex, hasSnapPoints, onClose, snapPoints]
  );

  const mobileSheetHeight = useMemo(() => {
    if (activeSnapFraction != null) {
      return `${activeSnapFraction * 100}vh`;
    }
    return maxHeight;
  }, [activeSnapFraction, maxHeight]);

  const dialogLabel = ariaLabel ?? title;
  const mobileTitleId = title && !ariaLabel ? 'bottom-sheet-mobile-title' : undefined;
  const desktopTitleId = title && !ariaLabel ? 'bottom-sheet-desktop-title' : undefined;
  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 30, stiffness: 300 };

  const defaultHeader = (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 pb-4 dark:border-gray-700">
      {title ? (
        <h3
          id="bottom-sheet-mobile-title"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h3>
      ) : null}
      <motion.button
        type="button"
        onClick={onClose}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        className={cn(
          'p-2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200',
          title ? 'ml-auto -mr-2 rounded-full' : 'ml-auto rounded-lg'
        )}
        aria-label="Close"
      >
        <X size={24} />
      </motion.button>
    </div>
  );

  const dragHandle = showDragHandle ? (
    <div
      className="flex shrink-0 cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing"
      onPointerDown={(event) => dragControls.start(event)}
    >
      <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
    </div>
  ) : null;

  const mobileHeaderChrome = header ? (
    <div
      className="shrink-0 cursor-grab active:cursor-grabbing"
      onPointerDown={(event) => dragControls.start(event)}
    >
      {header}
    </div>
  ) : (
    <div onPointerDown={(event) => dragControls.start(event)}>{defaultHeader}</div>
  );

  const footerChrome = footer ? (
    <div
      data-testid="bottom-sheet-footer"
      className="flex shrink-0 border-t border-gray-200 bg-gray-50/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
    >
      {footer}
    </div>
  ) : null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <OverlayPortal>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn(
              'fixed inset-0 cursor-default bg-black/50 backdrop-blur-[2px] md:hidden',
              overlayBackdropClassName
            )}
            aria-label={ariaLabel ? `Close ${ariaLabel}` : 'Dismiss sheet'}
          />

          <div
            className={cn('pointer-events-none fixed inset-0 md:hidden', overlaySurfaceClassName)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={dialogLabel}
              aria-labelledby={dialogLabel ? undefined : mobileTitleId}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={prefersReducedMotion ? 0 : 0.2}
              onDragEnd={handleMobileDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={springTransition}
              className={cn(
                'pointer-events-auto fixed inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-gray-800',
                className
              )}
              style={{
                maxHeight: mobileSheetHeight,
                height: mobileSheetHeight,
              }}
            >
              {dragHandle}
              {mobileHeaderChrome}
              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto px-6 py-4 text-gray-700 dark:text-gray-300',
                  contentClassName
                )}
              >
                {children}
              </div>
              {footerChrome}
            </motion.div>
          </div>

          {desktopPresentation === 'side-drawer' ? (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={cn(
                  'fixed inset-0 hidden cursor-default bg-black/50 backdrop-blur-[2px] md:block',
                  overlayBackdropClassName
                )}
                aria-label={ariaLabel ? `Close ${ariaLabel}` : 'Dismiss sheet'}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label={dialogLabel}
                aria-labelledby={dialogLabel ? undefined : desktopTitleId}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', damping: 32, stiffness: 320 }
                }
                className={cn(
                  'fixed inset-y-0 right-0 hidden w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 md:flex',
                  overlaySurfaceClassName,
                  className
                )}
              >
                {header ?? defaultHeader}
                <div
                  className={cn(
                    'min-h-0 flex-1 overflow-y-auto px-6 py-4 text-gray-700 dark:text-gray-300',
                    contentClassName
                  )}
                >
                  {children}
                </div>
                {footerChrome}
              </motion.aside>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={cn(
                  'fixed inset-0 hidden bg-black/50 md:block',
                  overlayBackdropClassName
                )}
              />
              <div
                className={cn(
                  'pointer-events-none fixed inset-0 hidden items-center justify-center overflow-y-auto p-4 md:flex',
                  overlaySurfaceClassName
                )}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialogLabel}
                  aria-labelledby={dialogLabel ? undefined : desktopTitleId}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.3 }
                  }
                  className={cn(
                    'pointer-events-auto relative flex w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800',
                    'max-h-[calc(100vh-4rem)]',
                    overlaySurfaceClassName,
                    className
                  )}
                >
                  <div className="shrink-0 border-b border-gray-200 px-6 pb-4 pt-6 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="absolute right-4 top-4 rounded text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Close dialog"
                    >
                      <X size={24} />
                    </button>
                    {title ? (
                      <h3
                        id="bottom-sheet-desktop-title"
                        className="pr-8 text-2xl font-bold text-gray-900 dark:text-white"
                      >
                        {title}
                      </h3>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      'min-h-0 flex-1 overflow-y-auto px-6 py-4 text-gray-700 dark:text-gray-300',
                      contentClassName
                    )}
                  >
                    {children}
                  </div>
                  {footerChrome}
                </motion.div>
              </div>
            </>
          )}
        </OverlayPortal>
      ) : null}
    </AnimatePresence>
  );
}
