/**
 * Z-index scale for full-viewport overlays (drawers, modals, sheets).
 * AdminLayout mobile header is z-50; sidebar is z-40 — overlays must sit above both.
 */
export const OVERLAY_BACKDROP_Z = 60;
export const OVERLAY_SURFACE_Z = 70;

/** Tailwind arbitrary z-index class names for overlay layers. */
export const overlayBackdropClassName = 'z-[60]';
export const overlaySurfaceClassName = 'z-[70]';
