import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudSun, Loader2, Plus } from 'lucide-react';
import { voyagerService } from '@/services/voyager.service';
import type { VoyagerArbitrageTarget, VoyagerBooking } from '@/types/api/voyager.types';
import Button from '@/components/atoms/Button';

const qk = {
  trips: ['voyager', 'trips'] as const,
  bookings: (tripId: string) => ['voyager', 'bookings', tripId] as const,
  arbitrage: ['voyager', 'arbitrage'] as const,
  snapshots: (id: string) => ['voyager', 'snapshots', id] as const,
};

function fmtCents(c?: number | null, cur = 'USD') {
  if (c == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(c / 100);
}

export default function VoyagerTripsTab() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weatherTripId, setWeatherTripId] = useState<string | null>(null);

  const tripsQ = useQuery({
    queryKey: qk.trips,
    queryFn: () => voyagerService.listTrips(),
  });

  const trips = tripsQ.data ?? [];
  const effectiveTripId = selectedId ?? trips[0]?.id ?? null;
  const activeTrip = trips.find((t) => t.id === effectiveTripId) ?? null;

  const bookingsQ = useQuery({
    queryKey: activeTrip ? qk.bookings(activeTrip.id) : ['voyager', 'bookings', 'none'],
    queryFn: () => voyagerService.listBookings(activeTrip!.id),
    enabled: !!activeTrip,
  });

  const arbQ = useQuery({
    queryKey: qk.arbitrage,
    queryFn: () => voyagerService.listArbitrageTargets(),
    enabled: !!activeTrip,
  });

  const byBooking = useMemo(() => {
    const m = new Map<string, VoyagerArbitrageTarget[]>();
    for (const a of arbQ.data ?? []) {
      const list = m.get(a.bookingId) ?? [];
      list.push(a);
      m.set(a.bookingId, list);
    }
    return m;
  }, [arbQ.data]);

  const createTrip = useMutation({
    mutationFn: voyagerService.createTrip,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trips }),
  });

  const createBooking = useMutation({
    mutationFn: voyagerService.createBooking,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: qk.bookings(v.tripId) }),
  });

  const createArb = useMutation({
    mutationFn: voyagerService.createArbitrageTarget,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.arbitrage }),
  });

  const weatherQ = useQuery({
    queryKey: ['voyager', 'weather', weatherTripId],
    queryFn: () => voyagerService.getTripWeather(weatherTripId!),
    enabled: !!weatherTripId,
  });

  const packingQ = useQuery({
    queryKey: ['voyager', 'packing', weatherTripId],
    queryFn: () => voyagerService.packingHints(weatherTripId!),
    enabled: !!weatherTripId,
  });

  return (
    <div className="space-y-10">
      {tripsQ.isError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
          role="alert"
        >
          {(tripsQ.error as Error)?.message?.includes('503') ||
          (tripsQ.error as Error)?.message?.includes('Postgres')
            ? 'Voyager needs Postgres (DATABASE_URL) on the backend.'
            : (tripsQ.error as Error).message}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Upcoming & planned
        </h2>
        {tripsQ.isLoading ? (
          <Loader2 className="animate-spin text-teal-600" />
        ) : (
          <ul className="space-y-2">
            {trips.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                    effectiveTripId === t.id
                      ? 'border-teal-500/50 bg-teal-50/80 dark:bg-teal-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t.title || 'Untitled trip'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {[t.primaryDestination, t.startAt?.slice(0, 10), t.endAt?.slice(0, 10)]
                      .filter(Boolean)
                      .join(' · ') || 'No dates yet'}
                  </div>
                </button>
              </li>
            ))}
            {trips.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No trips yet — add one below.
              </p>
            )}
          </ul>
        )}

        <TripQuickAdd onCreate={(body) => createTrip.mutate(body)} busy={createTrip.isPending} />
      </section>

      {activeTrip && (
        <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Bookings & price watch
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setWeatherTripId(weatherTripId === activeTrip.id ? null : activeTrip.id)
                }
              >
                <CloudSun className="size-4" />
                {weatherTripId === activeTrip.id ? 'Hide weather' : 'Weather & packing'}
              </Button>
            </div>
          </div>

          {weatherTripId === activeTrip.id && (
            <div className="mb-6 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/50 p-4 text-sm">
              {weatherQ.isLoading && <Loader2 className="animate-spin size-5 text-sky-600" />}
              {weatherQ.data && (
                <>
                  <p className="text-sky-900 dark:text-sky-100 font-medium mb-2">
                    Forecast — {weatherQ.data.label}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {weatherQ.data.days.slice(0, 7).map((d) => (
                      <li
                        key={d.date}
                        className="rounded-lg bg-white/80 dark:bg-gray-900/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                      >
                        {d.date}:{' '}
                        {d.tempMinC != null && d.tempMaxC != null
                          ? `${Math.round(d.tempMinC)}–${Math.round(d.tempMaxC)}°C`
                          : '—'}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {packingQ.data && packingQ.data.length > 0 && (
                <ul className="mt-3 space-y-1 text-gray-700 dark:text-gray-300">
                  {packingQ.data.map((h, i) => (
                    <li key={i}>· {h.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {bookingsQ.isLoading ? (
            <Loader2 className="animate-spin text-teal-600" />
          ) : (
            <ul className="space-y-4">
              {(bookingsQ.data ?? []).map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  targets={byBooking.get(b.id) ?? []}
                  onAddArbitrage={(loc) =>
                    createArb.mutate({
                      bookingId: b.id,
                      scanStrategy: 'manualPriceUrl',
                      comparisonLocator: loc,
                      minSavingsPercent: 10,
                    })
                  }
                  arbitrageBusy={createArb.isPending}
                />
              ))}
              {(bookingsQ.data ?? []).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No bookings for this trip.
                </p>
              )}
            </ul>
          )}

          <BookingQuickAdd
            tripId={activeTrip.id}
            onCreate={(body) => createBooking.mutate(body)}
            busy={createBooking.isPending}
          />
        </section>
      )}
    </div>
  );
}

function TripQuickAdd({
  onCreate,
  busy,
}: {
  onCreate: (b: Parameters<typeof voyagerService.createTrip>[0]) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState('');
  const [dest, setDest] = useState('');
  return (
    <form
      className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ title: title.trim(), primaryDestination: dest || undefined, status: 'planned' });
        setTitle('');
        setDest('');
      }}
    >
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Title</label>
        <input
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekend in Lisbon"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
          Destination (optional)
        </label>
        <input
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="City or region"
        />
      </div>
      <Button type="submit" disabled={busy} className="gap-1">
        {busy ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4" />}
        Add trip
      </Button>
    </form>
  );
}

function BookingQuickAdd({
  tripId,
  onCreate,
  busy,
}: {
  tripId: string;
  onCreate: (b: Parameters<typeof voyagerService.createBooking>[0]) => void;
  busy: boolean;
}) {
  const [bookingType, setBookingType] = useState('flight');
  const [provider, setProvider] = useState('');
  const [cents, setCents] = useState('');
  return (
    <form
      className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const bookedAmountCents = cents ? parseInt(cents, 10) : undefined;
        onCreate({
          tripId,
          bookingType,
          providerName: provider || undefined,
          bookedAmountCents: Number.isFinite(bookedAmountCents) ? bookedAmountCents : undefined,
        });
        setProvider('');
        setCents('');
      }}
    >
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Add booking</p>
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value)}
        >
          {['flight', 'hotel', 'car', 'activity', 'dining'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="flex-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          placeholder="Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        />
        <input
          className="w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          placeholder="Booked (cents)"
          inputMode="numeric"
          value={cents}
          onChange={(e) => setCents(e.target.value.replace(/\D/g, ''))}
        />
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="animate-spin size-4" /> : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function BookingCard({
  booking,
  targets,
  onAddArbitrage,
  arbitrageBusy,
}: {
  booking: VoyagerBooking;
  targets: VoyagerArbitrageTarget[];
  onAddArbitrage: (comparisonLocator: string) => void;
  arbitrageBusy: boolean;
}) {
  const [quote, setQuote] = useState('');
  const last = targets[0];
  return (
    <li className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="font-medium capitalize text-gray-900 dark:text-white">
            {booking.bookingType}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {booking.providerName ?? 'Provider TBD'} · booked{' '}
            {fmtCents(booking.bookedAmountCents, booking.currency)}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        Price check (manual strategy): enter a <strong>quoted price in cents</strong> (e.g.{' '}
        <code>89900</code> for $899.00). Scheduled jobs compare against your booked amount.
      </div>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <input
          className="flex-1 min-w-[100px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1.5 text-xs font-mono"
          placeholder="Quoted cents"
          value={quote}
          onChange={(e) => setQuote(e.target.value.replace(/\D/g, ''))}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={arbitrageBusy || !quote}
          onClick={() => {
            onAddArbitrage(quote);
            setQuote('');
          }}
        >
          Watch price
        </Button>
      </div>
      {last && <SnapshotButton targetId={last.id} />}
    </li>
  );
}

function SnapshotButton({ targetId }: { targetId: string }) {
  const q = useQuery({
    queryKey: qk.snapshots(targetId),
    queryFn: () => voyagerService.listPriceSnapshots(targetId),
  });
  const rows = q.data ?? [];
  if (rows.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-gray-500">
      Last scan: {fmtCents(rows[0].quotedAmountCents, rows[0].currency)} — {rows[0].rawNote}
    </p>
  );
}
