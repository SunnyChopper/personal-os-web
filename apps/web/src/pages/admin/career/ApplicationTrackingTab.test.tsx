import { describe, expect, it } from 'vitest';

import { applicationStatusLabel } from './application-tracking-labels';

describe('ApplicationTrackingTab', () => {
  it('maps API status enums to labels', () => {
    expect(applicationStatusLabel('applied')).toBe('Applied');
    expect(applicationStatusLabel('firstInterview')).toBe('First Interview');
    expect(applicationStatusLabel('nthInterview')).toBe('Nth Interview');
    expect(applicationStatusLabel('acceptedOffer')).toBe('Accepted Offer');
    expect(applicationStatusLabel('unknown')).toBe('unknown');
  });
});
