/**
 * Z-index scale for full-viewport overlays (drawers, modals, sheets).
 * AdminLayout mobile header is z-50; sidebar is z-40 — overlays must sit above both.
 *
 * Nested layer (z-85/90) sits above Note AI Assist panel (z-80) inside Edit Note dialog.
 *
 * Floating menus (z-100) portaled to document.body sit above overlay surfaces (70) and
 * nested overlays (90) — e.g. Assistant ManualModelListbox inside the thread header popover.
 */
export const OVERLAY_BACKDROP_Z = 60;
export const OVERLAY_SURFACE_Z = 70;
export const NESTED_OVERLAY_BACKDROP_Z = 85;
export const NESTED_OVERLAY_SURFACE_Z = 90;
export const FLOATING_MENU_Z = 100;

/** Tailwind arbitrary z-index class names for overlay layers. */
export const overlayBackdropClassName = 'z-[60]';
export const overlaySurfaceClassName = 'z-[70]';
export const nestedOverlayBackdropClassName = 'z-[85]';
export const nestedOverlaySurfaceClassName = 'z-[90]';
export const floatingMenuClassName = 'z-[100]';

export type OverlayLayer = 'default' | 'nested';

export function overlayLayerClassNames(layer: OverlayLayer = 'default'): {
  backdrop: string;
  surface: string;
} {
  if (layer === 'nested') {
    return {
      backdrop: nestedOverlayBackdropClassName,
      surface: nestedOverlaySurfaceClassName,
    };
  }
  return {
    backdrop: overlayBackdropClassName,
    surface: overlaySurfaceClassName,
  };
}
