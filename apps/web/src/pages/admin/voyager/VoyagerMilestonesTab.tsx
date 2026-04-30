import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { voyagerService } from '@/services/voyager.service';

const qk = {
  restaurants: ['voyager', 'restaurants'] as const,
  milestones: ['voyager', 'milestones'] as const,
  drafts: ['voyager', 'reservation-drafts'] as const,
};

export default function VoyagerMilestonesTab() {
  const qc = useQueryClient();
  const restaurantsQ = useQuery({
    queryKey: qk.restaurants,
    queryFn: () => voyagerService.listRestaurants(),
  });
  const milestonesQ = useQuery({
    queryKey: qk.milestones,
    queryFn: () => voyagerService.listMilestones(),
  });
  const draftsQ = useQuery({
    queryKey: qk.drafts,
    queryFn: () => voyagerService.listReservationDrafts(),
  });

  const createRestaurant = useMutation({
    mutationFn: voyagerService.createRestaurant,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.restaurants }),
  });

  const createMilestone = useMutation({
    mutationFn: voyagerService.createMilestone,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.milestones }),
  });

  const patchDraft = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof voyagerService.patchReservationDraft>[1];
    }) => voyagerService.patchReservationDraft(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.drafts }),
  });

  const restaurants = restaurantsQ.data ?? [];

  return (
    <div className="space-y-10">
      {(restaurantsQ.isError || milestonesQ.isError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {(restaurantsQ.error as Error)?.message || (milestonesQ.error as Error)?.message}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Restaurant preferences
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Used when generating gentle reservation drafts (scheduled job looks ~30 days ahead).
        </p>
        {restaurantsQ.isLoading ? (
          <Loader2 className="animate-spin text-teal-600" />
        ) : (
          <ul className="space-y-2 mb-4">
            {restaurants.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                {r.reservationEmail && (
                  <span className="text-gray-500 dark:text-gray-400"> · {r.reservationEmail}</span>
                )}
              </li>
            ))}
            {restaurants.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No favorites saved yet.</p>
            )}
          </ul>
        )}
        <RestaurantQuickAdd
          onCreate={(b) => createRestaurant.mutate(b)}
          busy={createRestaurant.isPending}
        />
      </section>

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Anniversaries & milestones
        </h2>
        {milestonesQ.isLoading ? (
          <Loader2 className="animate-spin text-teal-600" />
        ) : (
          <ul className="space-y-2 mb-4">
            {(milestonesQ.data ?? []).map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {m.label || 'Milestone'}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {' '}
                  · {m.milestoneDate} ({m.timeZone})
                </span>
              </li>
            ))}
            {(milestonesQ.data ?? []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No milestones yet.</p>
            )}
          </ul>
        )}
        <MilestoneQuickAdd
          restaurants={restaurants}
          onCreate={(b) => createMilestone.mutate(b)}
          busy={createMilestone.isPending}
        />
      </section>

      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Reservation drafts
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Edit copy here; sending email is out of band — treat these as quiet prompts.
        </p>
        {draftsQ.isLoading ? (
          <Loader2 className="animate-spin text-teal-600" />
        ) : (
          <ul className="space-y-4">
            {(draftsQ.data ?? []).map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2"
              >
                <div className="text-xs uppercase tracking-wide text-gray-500">{d.status}</div>
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm font-medium"
                  defaultValue={d.emailSubject}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== d.emailSubject)
                      patchDraft.mutate({ id: d.id, body: { emailSubject: v } });
                  }}
                />
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                  defaultValue={d.emailBody}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== d.emailBody) patchDraft.mutate({ id: d.id, body: { emailBody: v } });
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={patchDraft.isPending}
                    onClick={() => patchDraft.mutate({ id: d.id, body: { status: 'archived' } })}
                  >
                    Archive
                  </Button>
                </div>
              </li>
            ))}
            {(draftsQ.data ?? []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No drafts yet — they appear as dates approach.
              </p>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function RestaurantQuickAdd({
  onCreate,
  busy,
}: {
  onCreate: (b: Parameters<typeof voyagerService.createRestaurant>[0]) => void;
  busy: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  return (
    <form
      className="flex flex-col sm:flex-row flex-wrap gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({ name: name.trim(), reservationEmail: email.trim() || undefined });
        setName('');
        setEmail('');
      }}
    >
      <input
        className="flex-1 min-w-[160px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
        placeholder="Restaurant name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
        placeholder="Reservation email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={busy} className="gap-1">
        {busy ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4" />}
        Save
      </Button>
    </form>
  );
}

function MilestoneQuickAdd({
  restaurants,
  onCreate,
  busy,
}: {
  restaurants: { id: string; name: string }[];
  onCreate: (b: Parameters<typeof voyagerService.createMilestone>[0]) => void;
  busy: boolean;
}) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [restId, setRestId] = useState('');
  return (
    <form
      className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
      onSubmit={(e) => {
        e.preventDefault();
        if (!date) return;
        onCreate({
          label: label.trim() || undefined,
          milestoneDate: date,
          timeZone: tz || 'UTC',
          restaurantPreferenceId: restId || undefined,
        });
        setLabel('');
        setDate('');
      }}
    >
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Add milestone</p>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          type="date"
          required
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm flex-1 min-w-[140px]"
          placeholder="Time zone (IANA)"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          value={restId}
          onChange={(e) => setRestId(e.target.value)}
        >
          <option value="">Restaurant (optional)</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="animate-spin size-4" /> : 'Add'}
        </Button>
      </div>
    </form>
  );
}
