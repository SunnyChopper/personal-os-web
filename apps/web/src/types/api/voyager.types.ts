/** Voyager API DTOs (camelCase — matches backend BaseApiModel serialization). */

export interface VoyagerTrip {
  id: string;
  title: string;
  startAt?: string | null;
  endAt?: string | null;
  primaryDestination?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerBooking {
  id: string;
  tripId: string;
  bookingType: string;
  providerName?: string | null;
  confirmationCode?: string | null;
  bookedAmountCents?: number | null;
  currency: string;
  travelStartAt?: string | null;
  travelEndAt?: string | null;
  refundableUntil?: string | null;
  bookingMetadataJson: Record<string, unknown>;
  sourceDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerArbitrageTarget {
  id: string;
  bookingId: string;
  scanStrategy: string;
  comparisonLocator: string;
  minSavingsPercent: number;
  minSavingsAmountCents?: number | null;
  lastScannedAt?: string | null;
  lastAlertedSnapshotId?: string | null;
  snoozeUntil?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerPriceSnapshot {
  id: string;
  arbitrageTargetId: string;
  quotedAmountCents?: number | null;
  currency: string;
  rawNote?: string | null;
  fetchedAt: string;
}

export interface VoyagerItinerarySource {
  id: string;
  tripId?: string | null;
  title: string;
  rawContent?: string | null;
  sourceKind: string;
  parseStatus: string;
  parseError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerItineraryItem {
  id: string;
  tripId?: string | null;
  sourceId: string;
  itemType: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timeZone?: string | null;
  locationName?: string | null;
  confirmationCode?: string | null;
  providerName?: string | null;
  bookingId?: string | null;
  rawSourceSpan?: string | null;
  sortIndex: number;
  extra: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VoyagerRestaurant {
  id: string;
  name: string;
  reservationEmail?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerMilestone {
  id: string;
  label: string;
  milestoneDate: string;
  timeZone: string;
  restaurantPreferenceId?: string | null;
  partySize?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerReservationDraft {
  id: string;
  milestoneId: string;
  restaurantPreferenceId?: string | null;
  emailSubject: string;
  emailBody: string;
  calendarBlockJson: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoyagerWeatherDay {
  date: string;
  precipitationMm?: number | null;
  tempMinC?: number | null;
  tempMaxC?: number | null;
  weatherCode?: number | null;
}

export interface VoyagerTripWeather {
  tripId: string;
  lat: number;
  lon: number;
  label: string;
  days: VoyagerWeatherDay[];
}

export interface VoyagerPackingHint {
  message: string;
  severity: string;
}
