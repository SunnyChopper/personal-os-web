import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { FormTextarea } from '../PersonalBrandingFormFields';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import type { CreateConnectionInteractionInput } from '@/types/api/personal-branding.dto';
import {
  ROLODEX_PLATFORMS,
  computeDefaultNextFollowUpDate,
  followUpDateInputToIso,
} from './rolodex-platform';

interface LogInteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connectionName: string;
  followUpCadenceDays?: number | null;
  isSubmitting?: boolean;
  initialCreatorText?: string;
  initialResponseVectorId?: string;
  initialEvidenceUrl?: string | null;
  initialChannel?: string | null;
  initialPlatform?: string | null;
  initialPlatformPostId?: string | null;
  onSubmit: (body: CreateConnectionInteractionInput) => Promise<void>;
}

const optionalFieldLabelClassName =
  'mb-1 block text-xs font-normal text-gray-500 dark:text-gray-400';
const cadenceLabelClassName =
  'mb-1 block text-xs font-normal text-gray-500 dark:text-gray-400';

export default function LogInteractionDialog({
  isOpen,
  onClose,
  connectionName,
  followUpCadenceDays = null,
  isSubmitting = false,
  initialCreatorText = '',
  initialResponseVectorId,
  initialEvidenceUrl = '',
  initialChannel = '',
  initialPlatform = null,
  initialPlatformPostId = null,
  onSubmit,
}: LogInteractionDialogProps) {
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('');
  const [creatorText, setCreatorText] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEvidenceUrl(initialEvidenceUrl ?? '');
    setDescription('');
    setChannel(initialChannel ?? '');
    setCreatorText(initialCreatorText);
    setNextFollowUpAt(computeDefaultNextFollowUpDate(followUpCadenceDays));
  }, [isOpen, initialCreatorText, followUpCadenceDays, initialEvidenceUrl, initialChannel]);

  const canSubmit = Boolean(evidenceUrl.trim() || description.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      interactionType: 'check_in',
      channel: channel.trim() || null,
      evidenceUrl: evidenceUrl.trim() || null,
      description: description.trim() || null,
      creatorText: creatorText.trim() || null,
      responseVectorId: initialResponseVectorId ?? null,
      nextFollowUpAt: followUpDateInputToIso(nextFollowUpAt),
      platform: initialPlatform,
      platformPostId: initialPlatformPostId,
    });
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Log check-in — ${connectionName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add evidence below — a link or short description is required to save.
        </p>
        <fieldset disabled={isSubmitting} className="space-y-3">
          <div className="space-y-3" role="group" aria-labelledby="log-interaction-evidence-heading">
            <p
              id="log-interaction-evidence-heading"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Evidence
            </p>
            <div>
              <label htmlFor="log-interaction-evidence-url" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                Evidence URL
              </label>
              <FormInput
                id="log-interaction-evidence-url"
                type="url"
                className="w-full"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Or describe the interaction if you don&apos;t have a link.
            </p>
            <div>
              <label htmlFor="log-interaction-description" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                Description
              </label>
              <FormTextarea
                id="log-interaction-description"
                className="min-h-[64px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened in this interaction?"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Optional</p>
            <div>
              <label htmlFor="log-interaction-channel" className={optionalFieldLabelClassName}>
                Channel
              </label>
              <Select
                id="log-interaction-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="">Select a channel…</option>
                {ROLODEX_PLATFORMS.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="log-interaction-creator-text" className={optionalFieldLabelClassName}>
                Creator text
              </label>
              <FormTextarea
                id="log-interaction-creator-text"
                className="min-h-[64px]"
                value={creatorText}
                onChange={(e) => setCreatorText(e.target.value)}
                placeholder="Their post or message you responded to"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
            <label htmlFor="log-interaction-next-follow-up" className={cadenceLabelClassName}>
              Next follow-up
            </label>
            <FormInput
              id="log-interaction-next-follow-up"
              type="date"
              className="w-full"
              value={nextFollowUpAt}
              onChange={(e) => setNextFollowUpAt(e.target.value)}
            />
            {followUpCadenceDays ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Defaults to {followUpCadenceDays} days from today based on your cadence. Adjust if
                needed.
              </p>
            ) : null}
          </div>
        </fieldset>
        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save interaction'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
