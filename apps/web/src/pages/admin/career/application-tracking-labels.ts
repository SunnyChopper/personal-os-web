/** Pure helpers for Application Tracking UI (kept out of `.tsx` for react-refresh lint). */

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
