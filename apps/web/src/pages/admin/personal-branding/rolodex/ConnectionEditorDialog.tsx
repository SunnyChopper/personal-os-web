import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import { FormInput } from '@/components/atoms/FormInput';
import { FormTextarea } from '../PersonalBrandingFormFields';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { linkAccentClassName, selectableChipClassName } from '../personal-branding-ui';
import type {
  CreateCreatorConnectionInput,
  CreatorConnection,
  RelationshipPriority,
  RelationshipStage,
  RelationshipType,
  UpdateCreatorConnectionInput,
} from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';
import {
  ROLODEX_CADENCE_PRESETS,
  ROLODEX_PLATFORMS,
  ROLODEX_PRIORITY_OPTIONS,
  ROLODEX_QUICK_TAGS,
  ROLODEX_STAGE_OPTIONS,
  ROLODEX_TYPE_OPTIONS,
  buildHandles,
  buildProfileUrl,
  getPlatformOption,
  parseConnectionProfile,
  resolveRelationshipPriority,
  type RolodexPlatformId,
} from './rolodex-platform';

interface ConnectionEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: CreatorConnection | null;
  isSubmitting?: boolean;
  onCreate: (body: CreateCreatorConnectionInput) => Promise<void>;
  onUpdate: (id: string, body: UpdateCreatorConnectionInput) => Promise<void>;
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseAngles(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function sectionTitle(title: string, description: string) {
  return (
    <div className="border-b border-gray-200 pb-2 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default function ConnectionEditorDialog({
  isOpen,
  onClose,
  initial,
  isSubmitting = false,
  onCreate,
  onUpdate,
}: ConnectionEditorDialogProps) {
  const [name, setName] = useState('');
  const [platformId, setPlatformId] = useState<RolodexPlatformId | null>(null);
  const [handleOrUrl, setHandleOrUrl] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>('');
  const [relationshipPriority, setRelationshipPriority] = useState<RelationshipPriority | ''>('');
  const [relationshipStage, setRelationshipStage] = useState<RelationshipStage | ''>('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [valueExchange, setValueExchange] = useState('');
  const [followUpCadenceDays, setFollowUpCadenceDays] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [conversationAnglesRaw, setConversationAnglesRaw] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [personalContext, setPersonalContext] = useState('');
  const [notes, setNotes] = useState('');

  const selectedPlatform = useMemo(() => getPlatformOption(platformId), [platformId]);
  const previewUrl = useMemo(() => {
    if (!platformId || !handleOrUrl.trim()) return null;
    return buildProfileUrl(platformId, handleOrUrl);
  }, [platformId, handleOrUrl]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      const parsed = parseConnectionProfile(initial);
      setName(initial.name);
      setPlatformId(parsed.platformId);
      setHandleOrUrl(parsed.handleOrUrl);
      setRelationshipType(initial.relationshipType ?? '');
      setRelationshipPriority(resolveRelationshipPriority(initial) ?? '');
      setRelationshipStage(initial.relationshipStage ?? '');
      setDesiredOutcome(initial.desiredOutcome ?? '');
      setValueExchange(initial.valueExchange ?? '');
      setFollowUpCadenceDays(
        initial.followUpCadenceDays != null ? String(initial.followUpCadenceDays) : ''
      );
      setNextFollowUpAt(toDateInputValue(initial.nextFollowUpAt));
      setNextAction(initial.nextAction ?? '');
      setConversationAnglesRaw((initial.conversationAngles ?? []).join('\n'));
      setTagsRaw((initial.tags ?? []).join(', '));
      setPersonalContext(initial.personalContext ?? '');
      setNotes(initial.notes ?? '');
    } else {
      setName('');
      setPlatformId(null);
      setHandleOrUrl('');
      setRelationshipType('');
      setRelationshipPriority('');
      setRelationshipStage('');
      setDesiredOutcome('');
      setValueExchange('');
      setFollowUpCadenceDays('');
      setNextFollowUpAt('');
      setNextAction('');
      setConversationAnglesRaw('');
      setTagsRaw('');
      setPersonalContext('');
      setNotes('');
    }
  }, [isOpen, initial]);

  const toggleQuickTag = (tag: string) => {
    const tags = parseTags(tagsRaw);
    if (tags.includes(tag)) {
      setTagsRaw(tags.filter((value) => value !== tag).join(', '));
      return;
    }
    setTagsRaw(tags.length > 0 ? `${tagsRaw}, ${tag}` : tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = parseTags(tagsRaw);
    const conversationAngles = parseAngles(conversationAnglesRaw);
    const targetProfileUrl =
      platformId && handleOrUrl.trim() ? buildProfileUrl(platformId, handleOrUrl) : null;
    const handles = platformId && handleOrUrl.trim() ? buildHandles(platformId, handleOrUrl) : {};

    const cadenceParsed = followUpCadenceDays.trim()
      ? Number.parseInt(followUpCadenceDays, 10)
      : null;
    const followUpCadence =
      cadenceParsed != null && !Number.isNaN(cadenceParsed) ? cadenceParsed : null;
    const nextFollowUpIso = nextFollowUpAt.trim()
      ? new Date(`${nextFollowUpAt}T12:00:00`).toISOString()
      : null;

    const body = {
      name: name.trim(),
      targetProfileUrl,
      handles,
      relationshipPriority: relationshipPriority || null,
      relationshipStage: relationshipStage || null,
      relationshipType: relationshipType || null,
      desiredOutcome: desiredOutcome.trim() || null,
      valueExchange: valueExchange.trim() || null,
      followUpCadenceDays: followUpCadence,
      nextFollowUpAt: nextFollowUpIso,
      nextAction: nextAction.trim() || null,
      conversationAngles,
      personalContext: personalContext.trim() || null,
      tags,
      notes: notes.trim() || null,
    };

    if (initial) {
      await onUpdate(initial.id, body);
    } else {
      await onCreate(body);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit connection' : 'New connection'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting} className="space-y-6">
          <div className="space-y-4">
            {sectionTitle('Identity', 'Who they are and where you engage them')}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Name
              </label>
              <FormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Creator or company name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Relationship type
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLODEX_TYPE_OPTIONS.map((option) => {
                  const isSelected = relationshipType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRelationshipType(isSelected ? '' : option.value)}
                      className={cn(
                        selectableChipClassName(isSelected),
                        'rounded-full px-3 py-1 text-xs'
                      )}
                      aria-pressed={isSelected}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Platform
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLODEX_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = platformId === platform.id;
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => {
                        setPlatformId(platform.id);
                        if (platform.requiresFullUrl) setHandleOrUrl('');
                      }}
                      className={cn(
                        selectableChipClassName(isSelected),
                        'flex items-center gap-2 px-3 py-2.5 text-left'
                      )}
                      aria-pressed={isSelected}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate font-medium">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {platformId ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedPlatform?.requiresFullUrl ? 'Profile URL' : 'Username / handle'}
                </label>
                {selectedPlatform?.requiresFullUrl ? (
                  <FormInput
                    type="url"
                    value={handleOrUrl}
                    onChange={(e) => setHandleOrUrl(e.target.value)}
                    placeholder={selectedPlatform.placeholder}
                  />
                ) : (
                  <div className="flex overflow-hidden rounded-md border border-gray-300 shadow-sm dark:border-gray-600">
                    <span className="flex items-center bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      {selectedPlatform?.domainPrefix}
                    </span>
                    <FormInput
                      value={handleOrUrl}
                      onChange={(e) => setHandleOrUrl(e.target.value)}
                      placeholder={selectedPlatform?.placeholder ?? 'username'}
                      className="rounded-none border-0 shadow-none focus:ring-0"
                    />
                  </div>
                )}
                {previewUrl ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Profile link:{' '}
                    <span className={cn('font-mono', linkAccentClassName)}>{previewUrl}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {sectionTitle(
              'Strategy',
              'Why this relationship matters and what you are building toward'
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Priority
              </label>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                How intentionally should you maintain this relationship?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLODEX_PRIORITY_OPTIONS.map((option) => {
                  const isSelected = relationshipPriority === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRelationshipPriority(isSelected ? '' : option.value)}
                      className={cn(selectableChipClassName(isSelected), 'px-3 py-2.5 text-left')}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Stage
              </label>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Where does the relationship stand today?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLODEX_STAGE_OPTIONS.map((option) => {
                  const isSelected = relationshipStage === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRelationshipStage(isSelected ? '' : option.value)}
                      className={cn(selectableChipClassName(isSelected), 'px-3 py-2.5 text-left')}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Desired outcome
              </label>
              <FormTextarea
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="What would make this relationship valuable over the next 3–6 months?"
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Value exchange
              </label>
              <FormTextarea
                value={valueExchange}
                onChange={(e) => setValueExchange(e.target.value)}
                placeholder="What can you credibly offer them?"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            {sectionTitle('Follow-up', 'When and how to take the next step')}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Cadence (days)
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {ROLODEX_CADENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setFollowUpCadenceDays(String(preset.days))}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <FormInput
                type="number"
                min={1}
                max={365}
                value={followUpCadenceDays}
                onChange={(e) => setFollowUpCadenceDays(e.target.value)}
                placeholder="e.g. 14"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Next follow-up
              </label>
              <FormInput
                type="date"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Next action
              </label>
              <FormTextarea
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="What is the next useful move?"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            {sectionTitle('Context', 'Hooks and notes that make outreach natural')}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Conversation angles
              </label>
              <FormTextarea
                value={conversationAnglesRaw}
                onChange={(e) => setConversationAnglesRaw(e.target.value)}
                placeholder="One topic or hook per line…"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Tags
              </label>
              <FormInput
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="AI, SaaS, creator economy…"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ROLODEX_QUICK_TAGS.map((tag) => {
                  const isActive = parseTags(tagsRaw).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleQuickTag(tag)}
                      className={cn(
                        selectableChipClassName(isActive),
                        'rounded-full px-2.5 py-1 text-xs'
                      )}
                      aria-pressed={isActive}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Personal context
              </label>
              <FormTextarea
                value={personalContext}
                onChange={(e) => setPersonalContext(e.target.value)}
                placeholder="Preferences, background, prior commitments, boundaries…"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                General notes
              </label>
              <FormTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else worth remembering…"
                rows={2}
              />
            </div>
          </div>
        </fieldset>

        <DialogFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Saving…' : initial ? 'Save changes' : 'Create connection'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
