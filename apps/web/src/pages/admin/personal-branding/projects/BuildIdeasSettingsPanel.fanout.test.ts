import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('BuildIdeasSettingsPanel brand-identity fan-out guard', () => {
  it('uses useBrandProfilesList instead of usePersonalBrandingBrandIdentity', () => {
    const source = readFileSync(resolve(__dirname, './BuildIdeasSettingsPanel.tsx'), 'utf8');
    expect(source).not.toMatch(/usePersonalBrandingBrandIdentity/);
    expect(source).toMatch(/useBrandProfilesList/);
  });
});
