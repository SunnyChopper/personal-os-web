import { describe, expect, it } from 'vitest';
import {
  specialistPageContainerClassName,
  specialistPageScrollClassName,
} from './specialist-admin-surfaces';

describe('specialist-admin-surfaces', () => {
  it('keeps the full-bleed Assistant page padded and independently scrollable', () => {
    expect(specialistPageScrollClassName).toContain('overflow-y-auto');
    expect(specialistPageContainerClassName).toContain('pt-20');
    expect(specialistPageContainerClassName).toContain('lg:pt-8');
  });
});
