import { describe, expect, it } from 'vitest';
import { FLOATING_MENU_Z, NESTED_OVERLAY_SURFACE_Z, OVERLAY_SURFACE_Z } from '@/lib/overlay-layer';

describe('overlay-layer z-index scale', () => {
  it('orders floating menus above overlay surfaces and nested overlays', () => {
    expect(FLOATING_MENU_Z).toBeGreaterThan(NESTED_OVERLAY_SURFACE_Z);
    expect(FLOATING_MENU_Z).toBeGreaterThan(OVERLAY_SURFACE_Z);
    expect(NESTED_OVERLAY_SURFACE_Z).toBeGreaterThan(OVERLAY_SURFACE_Z);
  });
});
