import { describe, expect, it } from 'vitest';
import {
  formatSocialCapitalAngleLabel,
  normalizeSocialCapitalAngleKey,
} from '@/lib/personal-branding/social-capital-angle';

describe('social-capital-angle', () => {
  it('maps canonical enum values to labels', () => {
    expect(formatSocialCapitalAngleLabel('knowledge')).toBe('Knowledge');
    expect(formatSocialCapitalAngleLabel('joinConnections')).toBe('Join connections');
  });

  it('normalizes legacy snake_case keys', () => {
    expect(normalizeSocialCapitalAngleKey('join_connections')).toBe('joinConnections');
    expect(formatSocialCapitalAngleLabel('join_connections')).toBe('Join connections');
  });

  it('falls back to title-cased free text for unknown angles', () => {
    expect(formatSocialCapitalAngleLabel('Supportive')).toBe('Supportive');
  });
});
