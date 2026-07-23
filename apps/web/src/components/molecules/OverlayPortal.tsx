import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface OverlayPortalProps {
  children: ReactNode;
}

/**
 * Renders overlay UI at document.body so fixed backdrops cover the full viewport
 * and are not clipped or offset by transformed AdminLayout ancestors.
 */
export default function OverlayPortal({ children }: OverlayPortalProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
