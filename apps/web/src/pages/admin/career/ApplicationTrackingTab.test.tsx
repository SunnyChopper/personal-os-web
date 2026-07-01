import { describe, expect, it } from 'vitest';

import {
  applicationStatusLabel,
  reachClassificationLabel,
  rejectionTriageBucketLabel,
} from './application-tracking-labels';

describe('ApplicationTrackingTab', () => {
  it('maps API status enums to labels', () => {
    expect(applicationStatusLabel('applied')).toBe('Applied');
    expect(applicationStatusLabel('firstInterview')).toBe('First Interview');
    expect(applicationStatusLabel('nthInterview')).toBe('Nth Interview');
    expect(applicationStatusLabel('acceptedOffer')).toBe('Accepted Offer');
    expect(applicationStatusLabel('unknown')).toBe('unknown');
  });

  it('maps rejection triage buckets to banner labels', () => {
    expect(rejectionTriageBucketLabel('AUTOMATED_FAST')).toBe('ATS filter');
    expect(rejectionTriageBucketLabel('HUMAN_REVIEW')).toBe('Recruiter pass');
    expect(rejectionTriageBucketLabel('UNKNOWN')).toBe('Unknown');
    expect(rejectionTriageBucketLabel(null)).toBe('Unknown');
  });

  it('maps reach classification to UI labels', () => {
    expect(reachClassificationLabel('strongFit')).toBe('Strong fit');
    expect(reachClassificationLabel('stretch')).toBe('Stretch');
    expect(reachClassificationLabel('outOfReach')).toBe('Out of reach');
    expect(reachClassificationLabel(null)).toBe('Stretch');
  });

  it('formats zero rejection rate for analytics banner', () => {
    const rate = 0;
    expect(`${(rate * 100).toFixed(1)}%`).toBe('0.0%');
  });
});
