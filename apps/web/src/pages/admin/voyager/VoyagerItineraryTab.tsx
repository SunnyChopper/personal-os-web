import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, Wand2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { voyagerService } from '@/services/voyager.service';

const qk = {
  trips: ['voyager', 'trips'] as const,
  items: (tripId: string | undefined) => ['voyager', 'itinerary-items', tripId ?? 'all'] as const,
};

export default function VoyagerItineraryTab() {
  const qc = useQueryClient();
  const [tripFilter, setTripFilter] = useState<string>('');
  const [paste, setPaste] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const tripsQ = useQuery({ queryKey: qk.trips, queryFn: () => voyagerService.listTrips() });
  const trips = tripsQ.data ?? [];

  const itemsQ = useQuery({
    queryKey: qk.items(tripFilter || undefined),
    queryFn: () => voyagerService.listItineraryItems(tripFilter || undefined),
  });

  const parseSource = useMutation({
    mutationFn: (sourceId: string) => voyagerService.parseItinerarySource(sourceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voyager', 'itinerary-items'] }),
  });

  const createText = useMutation({
    mutationFn: () =>
      voyagerService.createItinerarySource({
        rawContent: paste,
        tripId: tripFilter || undefined,
        title: 'Pasted itinerary',
      }),
    onSuccess: async (src) => {
      setPaste('');
      await parseSource.mutateAsync(src.id);
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) =>
      voyagerService.uploadItineraryFile(file, {
        tripId: tripFilter || undefined,
        title: file.name,
      }),
    onSuccess: async (out) => {
      await parseSource.mutateAsync(out.sourceId);
    },
  });

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) uploadFile.mutate(f);
    },
    [uploadFile]
  );

  const items = itemsQ.data ?? [];

  return (
    <div className="space-y-10">
      {itemsQ.isError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {(itemsQ.error as Error).message}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Filter by trip</h2>
        <select
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm max-w-md"
          value={tripFilter}
          onChange={(e) => setTripFilter(e.target.value)}
        >
          <option value="">All items</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title || t.id}
            </option>
          ))}
        </select>
      </section>

      <section
        className={`rounded-2xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-950/20'
            : 'border-gray-300 dark:border-gray-600 bg-white/40 dark:bg-gray-900/30'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
          <FileUp className="size-5 text-teal-600" />
          <span className="font-medium">Drop a confirmation PDF or email export</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Files use the same secure upload path as your vault; Voyager keeps them leisure-scoped.
        </p>
        <label className="inline-flex">
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile.mutate(f);
              e.target.value = '';
            }}
          />
          <span className="cursor-pointer rounded-full px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700">
            Choose file
          </span>
        </label>
        {uploadFile.isPending && (
          <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="animate-spin size-4" /> Uploading & parsing…
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Or paste raw confirmation text
        </h2>
        <textarea
          className="w-full min-h-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm"
          placeholder="Flight confirmations, hotel emails…"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="mt-3">
          <Button
            type="button"
            disabled={!paste.trim() || createText.isPending || parseSource.isPending}
            onClick={() => createText.mutate()}
            className="gap-2"
          >
            {createText.isPending || parseSource.isPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Wand2 className="size-4" />
            )}
            Save & parse
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Timeline</h2>
        {itemsQ.isLoading ? (
          <Loader2 className="animate-spin text-teal-600" />
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No itinerary items yet.</p>
        ) : (
          <ul className="space-y-3">
            {items
              .slice()
              .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
              .map((it) => (
                <li
                  key={it.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{it.title}</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {it.itemType}
                    {it.startsAt && ` · ${it.startsAt}`}
                    {it.locationName && ` · ${it.locationName}`}
                  </div>
                  {it.confirmationCode && (
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {it.confirmationCode}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
