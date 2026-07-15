import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import Dialog from '@/components/molecules/Dialog';
import { FormField } from '@/components/molecules/FormField';
import MultiCombobox from '@/components/molecules/MultiCombobox';
import {
  buildRadarDiscoveryInput,
  effectiveRadarDiscoveryTopics,
  validateRadarDiscoveryInput,
} from '@/lib/personal-branding/radar-discovery';
import type { BrandProfile, StartRadarDiscoveryRunInput } from '@/types/api/personal-branding.dto';

interface RadarDiscoverySetupDialogProps {
  isOpen: boolean;
  profiles: BrandProfile[];
  isLoadingProfiles?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onStart: (input: StartRadarDiscoveryRunInput) => Promise<void>;
}

export default function RadarDiscoverySetupDialog({
  isOpen,
  profiles,
  isLoadingProfiles = false,
  isSubmitting = false,
  onClose,
  onStart,
}: RadarDiscoverySetupDialogProps) {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [pillarsByProfile, setPillarsByProfile] = useState<Record<string, string[]>>({});
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [customTopicDraft, setCustomTopicDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedProfileIds([]);
    setPillarsByProfile({});
    setCustomTopics([]);
    setCustomTopicDraft('');
    setError(null);
  }, [isOpen]);

  const profilesById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles]
  );
  const input = useMemo(
    () => buildRadarDiscoveryInput(selectedProfileIds, pillarsByProfile, customTopics),
    [customTopics, pillarsByProfile, selectedProfileIds]
  );
  const effectiveTopics = useMemo(
    () => effectiveRadarDiscoveryTopics(input.profileSelections, input.customTopics),
    [input]
  );

  const handleProfilesChange = (next: string[]) => {
    setSelectedProfileIds(next);
    setPillarsByProfile((current) => {
      const updated: Record<string, string[]> = {};
      for (const profileId of next) {
        updated[profileId] = current[profileId] ?? [
          ...(profilesById.get(profileId)?.pillars ?? []),
        ];
      }
      return updated;
    });
    setError(null);
  };

  const addCustomTopic = () => {
    const topic = customTopicDraft.trim();
    if (!topic) return;
    setCustomTopics((current) => [...current, topic]);
    setCustomTopicDraft('');
    setError(null);
  };

  const handleSubmit = async () => {
    const validationError = validateRadarDiscoveryInput(input, profiles);
    if (validationError) {
      setError(validationError);
      return;
    }
    await onStart(input);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Set up source discovery"
      size="xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
          Discovery grounds its search in the selected profiles, their descriptions, target
          audiences, chosen pillars, and your custom topics. Content templates and platform rules
          are not used.
        </div>

        <FormField
          label="Brand profiles"
          required
          error={
            !isLoadingProfiles && profiles.length === 0
              ? 'Create a brand profile before running discovery.'
              : null
          }
          hint="Choose one or more profiles to ground the search."
        >
          <MultiCombobox
            value={selectedProfileIds}
            onChange={handleProfilesChange}
            options={profiles.map((profile) => ({ value: profile.id, label: profile.name }))}
            placeholder="Search profiles…"
            isLoading={isLoadingProfiles}
            disabled={isLoadingProfiles || profiles.length === 0 || isSubmitting}
          />
        </FormField>

        {selectedProfileIds.map((profileId) => {
          const profile = profilesById.get(profileId);
          if (!profile) return null;
          return (
            <section
              key={profileId}
              aria-labelledby={`radar-profile-${profileId}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
            >
              <h4
                id={`radar-profile-${profileId}`}
                className="font-medium text-gray-900 dark:text-white"
              >
                {profile.name} pillars
              </h4>
              {profile.description || profile.targetAudience ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {[
                    profile.description,
                    profile.targetAudience && `Audience: ${profile.targetAudience}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
              <MultiCombobox
                className="mt-3"
                value={pillarsByProfile[profileId] ?? []}
                onChange={(pillars) => {
                  setPillarsByProfile((current) => ({ ...current, [profileId]: pillars }));
                  setError(null);
                }}
                options={profile.pillars}
                placeholder="Choose pillars…"
                disabled={isSubmitting}
              />
              {profile.pillars.length === 0 ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  This profile has no pillars. Add pillars in Brand Identity before selecting it.
                </p>
              ) : null}
            </section>
          );
        })}

        <FormField
          label="Custom topics"
          hint="Optional topics are combined with the selected pillars and deduplicated."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormInput
              value={customTopicDraft}
              onChange={(event) => setCustomTopicDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomTopic();
                }
              }}
              placeholder="Add a topic"
              disabled={isSubmitting}
              className="min-w-0 flex-1"
              aria-label="Custom topic"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addCustomTopic}
              disabled={!customTopicDraft.trim() || isSubmitting}
              className="gap-1.5"
            >
              <Plus className="size-4" aria-hidden />
              Add topic
            </Button>
          </div>
          {customTopics.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {customTopics.map((topic, index) => (
                <span
                  key={`${topic}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-sm text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTopics((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    className="rounded p-0.5 hover:bg-violet-200 dark:hover:bg-violet-800"
                    aria-label={`Remove ${topic}`}
                    disabled={isSubmitting}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </FormField>

        <section aria-labelledby="effective-topics-heading">
          <h4
            id="effective-topics-heading"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Effective topics ({effectiveTopics.length})
          </h4>
          {effectiveTopics.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {effectiveTopics.map((topic) => (
                <span
                  key={topic.toLocaleLowerCase()}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select profile pillars or add custom topics to preview the search scope.
            </p>
          )}
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || isLoadingProfiles || profiles.length === 0}
          >
            {isSubmitting ? 'Queueing discovery…' : 'Queue discovery'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
