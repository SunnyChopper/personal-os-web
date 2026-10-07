import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/routes';
import { BrandProfileReadinessCallout } from './BrandProfileReadinessCallout';

describe('BrandProfileReadinessCallout', () => {
  it('links to core-profile when no profiles exist', () => {
    render(
      <MemoryRouter>
        <BrandProfileReadinessCallout variant="missing-profile" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /open brand identity/i });
    expect(link).toHaveAttribute(
      'href',
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile`
    );
  });

  it('links to pillars section for incomplete profile', () => {
    render(
      <MemoryRouter>
        <BrandProfileReadinessCallout variant="incomplete-profile" profileId="profile-1" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /fix pillars & audience/i });
    expect(link).toHaveAttribute(
      'href',
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile&profileId=profile-1&section=pillars`
    );
  });
});
