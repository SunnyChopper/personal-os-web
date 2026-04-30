import { apiClient } from '@/lib/api-client';
import type {
  VoyagerArbitrageTarget,
  VoyagerBooking,
  VoyagerItineraryItem,
  VoyagerItinerarySource,
  VoyagerMilestone,
  VoyagerPackingHint,
  VoyagerPriceSnapshot,
  VoyagerReservationDraft,
  VoyagerRestaurant,
  VoyagerTrip,
  VoyagerTripWeather,
} from '@/types/api/voyager.types';

async function unwrap<T>(
  p: Promise<{ success: boolean; data?: T; error?: { message?: string } }>
): Promise<T> {
  const res = await p;
  if (!res.success || res.data == null) {
    throw new Error(res.error?.message || 'Voyager request failed');
  }
  return res.data;
}

/** PUT file bytes to S3 presigned URL (same constraints as Knowledge Vault uploads). */
async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  try {
    const put = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    if (!put.ok) {
      throw new Error(`S3 upload failed: ${put.status} ${put.statusText}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Failed to fetch' || (e instanceof TypeError && msg.includes('fetch'))) {
      throw new Error(
        'Could not upload file to storage (network or S3 CORS). If this is production, ensure the files bucket allows PUT from your site origin.'
      );
    }
    throw e;
  }
}

export const voyagerService = {
  async listTrips(): Promise<VoyagerTrip[]> {
    const data = await unwrap(apiClient.get<{ items: VoyagerTrip[] }>('/voyager/trips'));
    return data.items;
  },

  async createTrip(body: {
    title?: string;
    startAt?: string;
    endAt?: string;
    primaryDestination?: string;
    status?: string;
    notes?: string;
  }): Promise<VoyagerTrip> {
    return unwrap(apiClient.post<VoyagerTrip>('/voyager/trips', body));
  },

  async getTripWeather(tripId: string): Promise<VoyagerTripWeather> {
    return unwrap(
      apiClient.get<VoyagerTripWeather>(`/voyager/trips/${encodeURIComponent(tripId)}/weather`)
    );
  },

  async packingHints(tripId: string): Promise<VoyagerPackingHint[]> {
    const data = await unwrap(
      apiClient.get<{ hints: VoyagerPackingHint[] }>(
        `/voyager/trips/${encodeURIComponent(tripId)}/packing-hints`
      )
    );
    return data.hints;
  },

  async listBookings(tripId: string): Promise<VoyagerBooking[]> {
    const data = await unwrap(
      apiClient.get<{ items: VoyagerBooking[] }>(
        `/voyager/bookings?tripId=${encodeURIComponent(tripId)}`
      )
    );
    return data.items;
  },

  async createBooking(body: {
    tripId: string;
    bookingType: string;
    providerName?: string;
    confirmationCode?: string;
    bookedAmountCents?: number;
    currency?: string;
    travelStartAt?: string;
    travelEndAt?: string;
    refundableUntil?: string;
    bookingMetadataJson?: Record<string, unknown>;
    sourceDocumentId?: string;
  }): Promise<VoyagerBooking> {
    return unwrap(apiClient.post<VoyagerBooking>('/voyager/bookings', body));
  },

  async listArbitrageTargets(): Promise<VoyagerArbitrageTarget[]> {
    const data = await unwrap(
      apiClient.get<{ items: VoyagerArbitrageTarget[] }>('/voyager/arbitrage-targets')
    );
    return data.items;
  },

  async createArbitrageTarget(body: {
    bookingId: string;
    scanStrategy?: string;
    comparisonLocator?: string;
    minSavingsPercent?: number;
    minSavingsAmountCents?: number;
    enabled?: boolean;
  }): Promise<VoyagerArbitrageTarget> {
    return unwrap(apiClient.post<VoyagerArbitrageTarget>('/voyager/arbitrage-targets', body));
  },

  async listPriceSnapshots(arbitrageTargetId: string): Promise<VoyagerPriceSnapshot[]> {
    const data = await unwrap(
      apiClient.get<{ items: VoyagerPriceSnapshot[] }>(
        `/voyager/price-snapshots?arbitrageTargetId=${encodeURIComponent(arbitrageTargetId)}`
      )
    );
    return data.items;
  },

  async listRestaurants(): Promise<VoyagerRestaurant[]> {
    const data = await unwrap(apiClient.get<{ items: VoyagerRestaurant[] }>('/voyager/restaurants'));
    return data.items;
  },

  async createRestaurant(body: {
    name: string;
    reservationEmail?: string;
    notes?: string;
  }): Promise<VoyagerRestaurant> {
    return unwrap(apiClient.post<VoyagerRestaurant>('/voyager/restaurants', body));
  },

  async listMilestones(): Promise<VoyagerMilestone[]> {
    const data = await unwrap(apiClient.get<{ items: VoyagerMilestone[] }>('/voyager/milestones'));
    return data.items;
  },

  async createMilestone(body: {
    label?: string;
    milestoneDate: string;
    timeZone?: string;
    restaurantPreferenceId?: string;
    partySize?: number;
    notes?: string;
  }): Promise<VoyagerMilestone> {
    return unwrap(apiClient.post<VoyagerMilestone>('/voyager/milestones', body));
  },

  async listReservationDrafts(): Promise<VoyagerReservationDraft[]> {
    const data = await unwrap(
      apiClient.get<{ items: VoyagerReservationDraft[] }>('/voyager/reservation-drafts')
    );
    return data.items;
  },

  async patchReservationDraft(
    draftId: string,
    body: { emailSubject?: string; emailBody?: string; status?: string }
  ): Promise<VoyagerReservationDraft> {
    return unwrap(
      apiClient.patch<VoyagerReservationDraft>(
        `/voyager/reservation-drafts/${encodeURIComponent(draftId)}`,
        body
      )
    );
  },

  async listItineraryItems(tripId?: string): Promise<VoyagerItineraryItem[]> {
    const q = tripId ? `?tripId=${encodeURIComponent(tripId)}` : '';
    const data = await unwrap(
      apiClient.get<{ items: VoyagerItineraryItem[] }>(`/voyager/itinerary/items${q}`)
    );
    return data.items;
  },

  async createItinerarySource(body: {
    rawContent: string;
    tripId?: string;
    title?: string;
  }): Promise<VoyagerItinerarySource> {
    return unwrap(apiClient.post<VoyagerItinerarySource>('/voyager/itinerary/sources', body));
  },

  async parseItinerarySource(sourceId: string): Promise<VoyagerItineraryItem[]> {
    const data = await unwrap(
      apiClient.post<{ sourceId: string; items: VoyagerItineraryItem[] }>(
        `/voyager/itinerary/sources/${encodeURIComponent(sourceId)}/parse`,
        {}
      )
    );
    return data.items;
  },

  async getItineraryUploadUrl(file: File): Promise<{ uploadUrl: string; fileId: string; s3Key: string }> {
    const data = await unwrap(
      apiClient.post<{ uploadUrl: string; fileId: string; s3Key: string }>(
        '/voyager/itinerary/upload-url',
        {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSizeBytes: file.size,
        }
      )
    );
    return data;
  },

  async completeItineraryUpload(body: {
    fileId: string;
    tripId?: string;
    title?: string;
  }): Promise<{ sourceId: string; fileId: string }> {
    return unwrap(
      apiClient.post<{ sourceId: string; fileId: string }>(
        '/voyager/itinerary/upload-complete',
        body
      )
    );
  },

  async uploadItineraryFile(
    file: File,
    opts?: { tripId?: string; title?: string }
  ): Promise<{ sourceId: string; fileId: string }> {
    const { uploadUrl, fileId } = await voyagerService.getItineraryUploadUrl(file);
    await uploadToS3(uploadUrl, file);
    return voyagerService.completeItineraryUpload({
      fileId,
      tripId: opts?.tripId,
      title: opts?.title ?? file.name,
    });
  },
};
