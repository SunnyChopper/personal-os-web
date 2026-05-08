/** Pure helpers for Application Tracking UI (kept out of `.tsx` for react-refresh lint). */

export function fitRecommendationLabel(v: string): string {
  if (v === 'apply') return 'Apply';
  if (v === 'skip') return 'Skip';
  return 'Maybe';
}

export function applicationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    applied: 'Applied',
    rejected: 'Rejected',
    firstInterview: 'First Interview',
    nthInterview: 'Nth Interview',
    finalInterview: 'Final Interview',
    offerReceived: 'Offer Received',
    acceptedOffer: 'Accepted Offer',
  };
  return map[status] ?? status;
}
