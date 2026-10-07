import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Rolodex only needs profile id/name options. Mounting the full Brand Identity
 * hook fan-out (output-tests / versions / detail / platform-rules) amplified
 * cold-start timeouts reported on later routes (alerts 567c68a56446, c6bd8a4286da).
 */
describe('RolodexPage brand-identity fan-out guard (567c68a56446)', () => {
  it('uses useBrandProfilesList instead of usePersonalBrandingBrandIdentity', () => {
    const source = readFileSync(resolve(__dirname, './RolodexPage.tsx'), 'utf8');
    expect(source).not.toMatch(/usePersonalBrandingBrandIdentity/);
    expect(source).toMatch(/useBrandProfilesList/);
  });
});
