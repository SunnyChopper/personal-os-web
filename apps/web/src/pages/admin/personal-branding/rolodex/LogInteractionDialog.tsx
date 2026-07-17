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
          Manual verification requires a link to evidence or a short description before saving.
        </p>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Evidence URL</label>
            <FormInput
              type="url"
              className="w-full"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened in this interaction?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Channel (optional)</label>
            <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Select a channel…</option>
              {ROLODEX_PLATFORMS.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Creator text (optional)</label>
            <FormTextarea
              value={creatorText}
              onChange={(e) => setCreatorText(e.target.value)}
              placeholder="Their post or message you responded to"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Next follow-up</label>
            <FormInput
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
