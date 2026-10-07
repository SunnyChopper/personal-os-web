import { useMemo, useState, type ReactNode } from 'react';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { FormInput } from '@/components/atoms/FormInput';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import FileUploadZone from '@/components/molecules/FileUploadZone';
import { FormField } from '@/components/molecules/FormField';
import MultiCombobox from '@/components/molecules/MultiCombobox';
import Dialog from '@/components/molecules/Dialog';
import { AssistantSpecialistGraphEditor } from '@/components/organisms/AssistantSpecialistGraphEditor';
import type {
  AssistantSpecialist,
  AssistantSpecialistDocument,
  AssistantSpecialistTriggerMode,
  AssistantToolRegistryEntry,
} from '@/types/api-contracts';
import {
  buildSpecialistFormSnapshot,
  specialistFormSnapshotsEqual,
  type SpecialistFormDraft,
} from '@/lib/assistant/specialist-form-snapshot';
import { specialistFormLimits } from '@/lib/assistant/specialist-form-limits';
import { specialistLivingContextOptions } from '@/lib/assistant/specialist-form-options';
import { cn } from '@/lib/utils';
import {
  specialistMutedTextClassName,
  specialistPanelClassName,
} from '@/lib/assistant/specialist-admin-surfaces';

const SPECIALIST_ID_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

function emptyDraft(): SpecialistFormDraft {
  return {
    id: '',
    displayName: '',
    systemPrompt: '',
    enabled: true,
    livingContextDomains: [],
    mode: 'auto',
    keywords: '',
    aliases: '',
    intentCategories: '',
    priority: '0',
    includeBrandProfile: false,
    includeLtm: false,
    includeToolResults: false,
    domainDeltaModules: '',
    toolNames: [],
    maxToolRounds: '0',
    timeoutSeconds: '12',
    temperature: '0.4',
    modelOverride: '',
    contextCharBudget: '2400',
    corpusIds: '',
    graphEnabled: false,
    graphId: '',
  };
}

function toDraft(row: AssistantSpecialist | null): SpecialistFormDraft {
  if (!row) return emptyDraft();
  return {
    id: row.id,
    displayName: row.displayName,
    systemPrompt: row.systemPrompt,
    enabled: row.enabled,
    livingContextDomains: [...row.livingContextDomains],
    mode: row.triggers.mode,
    keywords: row.triggers.keywords.join(', '),
    aliases: row.triggers.aliases.join(', '),
    intentCategories: row.triggers.intentCategories.join(', '),
    priority: String(row.triggers.priority),
    includeBrandProfile: row.includeBrandProfile,
    includeLtm: row.includeLtm,
    includeToolResults: row.includeToolResults,
    domainDeltaModules: row.domainDeltaModules.join(', '),
    toolNames: [...row.toolNames],
    maxToolRounds: String(row.maxToolRounds),
    timeoutSeconds: String(row.timeoutSeconds),
    temperature: String(row.temperature),
    modelOverride: row.modelOverride ?? '',
    contextCharBudget: String(row.contextCharBudget),
    corpusIds: row.corpusIds.join(', '),
    graphEnabled: row.graphEnabled,
    graphId: row.graphId ?? '',
  };
}

function csv(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function buildPayload(draft: SpecialistFormDraft, includeId: boolean): Record<string, unknown> {
  return {
    ...(includeId ? { id: draft.id.trim() } : {}),
    displayName: draft.displayName.trim(),
    systemPrompt: draft.systemPrompt.trim(),
    enabled: draft.enabled,
    livingContextDomains: [...draft.livingContextDomains],
    triggers: {
      mode: draft.mode,
      keywords: csv(draft.keywords),
      aliases: csv(draft.aliases),
      intentCategories: csv(draft.intentCategories),
      priority: Number(draft.priority),
    },
    includeBrandProfile: draft.includeBrandProfile,
    includeLtm: draft.includeLtm,
    includeToolResults: draft.includeToolResults,
    domainDeltaModules: csv(draft.domainDeltaModules),
    toolNames: [...draft.toolNames],
    maxToolRounds: Number(draft.maxToolRounds),
    timeoutSeconds: Number(draft.timeoutSeconds),
    temperature: Number(draft.temperature),
    modelOverride: draft.modelOverride.trim() || null,
    contextCharBudget: Number(draft.contextCharBudget),
    corpusIds: csv(draft.corpusIds),
    graphEnabled: draft.graphEnabled,
    graphId: draft.graphId.trim() || null,
  };
}

function toCreatePayload(draft: SpecialistFormDraft): Record<string, unknown> {
  return buildPayload(draft, true);
}

function toUpdatePayload(draft: SpecialistFormDraft): Record<string, unknown> {
  return buildPayload(draft, false);
}

function maxLengthError(value: string, maxLength: number, label: string): string | null {
  return value.length > maxLength ? `${label} must be ${maxLength} characters or fewer.` : null;
}

function csvListError(value: string, maxItems: number, label: string): string | null {
  return csv(value).length > maxItems ? `${label} supports at most ${maxItems} items.` : null;
}

function numericError(
  value: string,
  limit: { min: number; max: number; integer?: boolean },
  label: string
): string | null {
  if (!value.trim() || !Number.isFinite(Number(value))) {
    return `${label} must be a number.`;
  }
  const parsed = Number(value);
  if (limit.integer && !Number.isInteger(parsed)) {
    return `${label} must be a whole number.`;
  }
  if (parsed < limit.min || parsed > limit.max) {
    return `${label} must be between ${limit.min} and ${limit.max}.`;
  }
  return null;
}

function visibleError(
  error: string | null,
  field: string,
  touchedFields: Set<string>,
  submitAttempted: boolean
): string | null {
  return submitAttempted || touchedFields.has(field) ? error : null;
}

function FormSection({
  title,
  description,
  first = false,
  children,
}: {
  title: string;
  description?: string;
  first?: boolean;
  children: ReactNode;
}) {
  const sectionId = `specialist-section-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section
      className={cn('space-y-3', !first && 'border-t border-gray-200 pt-4 dark:border-gray-700')}
      aria-labelledby={sectionId}
    >
      <div>
        <h4 id={sectionId} className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export interface SpecialistFormModalProps {
  isOpen: boolean;
  specialist: AssistantSpecialist | null;
  toolRegistry?: AssistantToolRegistryEntry[];
  toolsLoading?: boolean;
  documents?: AssistantSpecialistDocument[];
  documentsLoading?: boolean;
  uploadingFile: string | null;
  uploadError: string | null;
  saving: boolean;
  saveError: Error | null;
  deletingDocument: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
  onUploadDocument: (files: File[]) => void;
  onDeleteDocument: (documentId: string) => void;
}

function SpecialistFormFields({
  specialist,
  toolRegistry,
  toolsLoading = false,
  documents,
  documentsLoading = false,
  uploadingFile,
  uploadError,
  saving,
  saveError,
  deletingDocument,
  onClose,
  onSave,
  onUploadDocument,
  onDeleteDocument,
}: Omit<SpecialistFormModalProps, 'isOpen'>) {
  const editingExisting = specialist !== null;
  const [draft, setDraft] = useState<SpecialistFormDraft>(() => toDraft(specialist));
  const [baseline] = useState(() => buildSpecialistFormSnapshot(toDraft(specialist)));
  const [toolFilter, setToolFilter] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());

  const updateDraft = <K extends keyof SpecialistFormDraft>(
    key: K,
    value: SpecialistFormDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const currentSnapshot = useMemo(() => buildSpecialistFormSnapshot(draft), [draft]);
  const isDirty = !specialistFormSnapshotsEqual(currentSnapshot, baseline);
  const touchField = (field: string) => {
    setTouchedFields((current) => {
      if (current.has(field)) return current;
      return new Set(current).add(field);
    });
  };
  const validationErrors = {
    id:
      !editingExisting &&
      (!SPECIALIST_ID_PATTERN.test(draft.id.trim()) ||
        draft.id.trim().length < specialistFormLimits.id.minLength ||
        draft.id.trim().length > specialistFormLimits.id.maxLength)
        ? 'Use 2–64 characters: lowercase letters, numbers, and underscores; start with a letter.'
        : null,
    displayName: !draft.displayName.trim()
      ? 'Display name is required.'
      : maxLengthError(
          draft.displayName,
          specialistFormLimits.displayName.maxLength,
          'Display name'
        ),
    systemPrompt: !draft.systemPrompt.trim()
      ? 'System prompt is required.'
      : maxLengthError(
          draft.systemPrompt,
          specialistFormLimits.systemPrompt.maxLength,
          'System prompt'
        ),
    priority: numericError(draft.priority, specialistFormLimits.priority, 'Trigger priority'),
    keywords: csvListError(draft.keywords, specialistFormLimits.keywords.maxItems, 'Keywords'),
    aliases: csvListError(draft.aliases, specialistFormLimits.aliases.maxItems, 'Aliases'),
    intentCategories: csvListError(
      draft.intentCategories,
      specialistFormLimits.intentCategories.maxItems,
      'Intent categories'
    ),
    livingContextDomains:
      draft.livingContextDomains.length > specialistFormLimits.livingContextDomains.maxItems
        ? `Living-context domains support at most ${specialistFormLimits.livingContextDomains.maxItems} items.`
        : null,
    domainDeltaModules: csvListError(
      draft.domainDeltaModules,
      specialistFormLimits.domainDeltaModules.maxItems,
      'Domain-delta modules'
    ),
    maxToolRounds: numericError(
      draft.maxToolRounds,
      specialistFormLimits.maxToolRounds,
      'Max read-only tool rounds'
    ),
    timeoutSeconds: numericError(
      draft.timeoutSeconds,
      specialistFormLimits.timeoutSeconds,
      'Timeout seconds'
    ),
    temperature: numericError(draft.temperature, specialistFormLimits.temperature, 'Temperature'),
    modelOverride: maxLengthError(
      draft.modelOverride,
      specialistFormLimits.modelOverride.maxLength,
      'Model override'
    ),
    contextCharBudget: numericError(
      draft.contextCharBudget,
      specialistFormLimits.contextCharBudget,
      'Context character budget'
    ),
    corpusIds: csvListError(draft.corpusIds, specialistFormLimits.corpusIds.maxItems, 'Corpus ids'),
    graphId: maxLengthError(draft.graphId, specialistFormLimits.graphId.maxLength, 'Graph id'),
  };
  const idError = visibleError(validationErrors.id, 'id', touchedFields, submitAttempted);
  const displayNameError = visibleError(
    validationErrors.displayName,
    'displayName',
    touchedFields,
    submitAttempted
  );
  const systemPromptError = visibleError(
    validationErrors.systemPrompt,
    'systemPrompt',
    touchedFields,
    submitAttempted
  );
  const fieldError = (field: keyof typeof validationErrors) =>
    visibleError(validationErrors[field], field, touchedFields, submitAttempted);
  const isFormValid = Object.values(validationErrors).every((error) => error === null);

  const filteredTools = useMemo(() => {
    const query = toolFilter.trim().toLowerCase();
    return (toolRegistry ?? [])
      .filter((tool) => tool.safeRead)
      .filter(
        (tool) =>
          !query ||
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
      );
  }, [toolFilter, toolRegistry]);

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isFormValid) return;
    onSave(editingExisting ? toUpdatePayload(draft) : toCreatePayload(draft));
  };

  const toggleTool = (toolName: string, checked: boolean) => {
    const names = new Set(draft.toolNames);
    if (checked) names.add(toolName);
    else names.delete(toolName);
    updateDraft('toolNames', [...names]);
  };

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isDirty ? (
        <span role="status" className="mr-auto text-sm text-amber-700 dark:text-amber-300">
          Unsaved changes
        </span>
      ) : (
        <span className="mr-auto" aria-hidden />
      )}
      <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={saving || !isFormValid || (editingExisting && !isDirty)}
      >
        {saving ? 'Saving…' : 'Save specialist'}
      </Button>
    </div>
  );

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={editingExisting ? `Edit ${draft.displayName || 'specialist'}` : 'New specialist'}
      size="xl"
      trapFocus
      footer={footer}
    >
      <div className="space-y-5">
        <FormSection
          title="Identity"
          description="Name this advisory perspective and define its voice."
          first
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Id (lowercase slug)"
              htmlFor="specialist-id"
              required={!editingExisting}
              error={idError}
              hint={
                editingExisting ? 'The specialist id cannot be changed after creation.' : undefined
              }
            >
              <FormInput
                id="specialist-id"
                value={draft.id}
                disabled={editingExisting}
                onBlur={() => touchField('id')}
                onChange={(event) => updateDraft('id', event.target.value)}
                placeholder="growth_coach"
                maxLength={specialistFormLimits.id.maxLength}
                aria-invalid={Boolean(idError)}
                aria-describedby={idError ? 'specialist-id-error' : undefined}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Display name"
              htmlFor="specialist-display-name"
              required
              error={displayNameError}
            >
              <FormInput
                id="specialist-display-name"
                value={draft.displayName}
                onBlur={() => touchField('displayName')}
                onChange={(event) => updateDraft('displayName', event.target.value)}
                placeholder="Growth Coach"
                maxLength={specialistFormLimits.displayName.maxLength}
                aria-invalid={Boolean(displayNameError)}
                aria-describedby={displayNameError ? 'specialist-display-name-error' : undefined}
                className="w-full"
              />
            </FormField>
          </div>
          <FormField
            label="System prompt"
            htmlFor="specialist-system-prompt"
            required
            error={systemPromptError}
            hint="Describe the advisory lens, boundaries, and response style."
          >
            <Textarea
              id="specialist-system-prompt"
              rows={6}
              value={draft.systemPrompt}
              onBlur={() => touchField('systemPrompt')}
              onChange={(event) => updateDraft('systemPrompt', event.target.value)}
              placeholder="Define the advisory lens…"
              maxLength={specialistFormLimits.systemPrompt.maxLength}
              aria-invalid={Boolean(systemPromptError)}
              aria-describedby={systemPromptError ? 'specialist-system-prompt-error' : undefined}
              className="max-h-56 w-full overflow-y-auto"
            />
          </FormField>
          <FormField label="Availability" htmlFor="specialist-enabled">
            <label className="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <FormCheckbox
                id="specialist-enabled"
                checked={draft.enabled}
                onChange={(event) => updateDraft('enabled', event.target.checked)}
              />
              Consult this specialist when its trigger rules match
            </label>
          </FormField>
        </FormSection>

        <FormSection
          title="Triggers"
          description="Control when this specialist is eligible for a turn."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Trigger mode" htmlFor="specialist-trigger-mode">
              <Select
                id="specialist-trigger-mode"
                value={draft.mode}
                onChange={(event) =>
                  updateDraft('mode', event.target.value as AssistantSpecialistTriggerMode)
                }
                className="w-full"
              >
                <option value="auto">Auto — keywords and intent</option>
                <option value="manualOnly">Manual only</option>
                <option value="always">Always (non-skipped turns)</option>
              </Select>
            </FormField>
            <FormField
              label="Trigger priority"
              htmlFor="specialist-trigger-priority"
              error={fieldError('priority')}
              hint="Higher values win when several specialists match."
            >
              <FormInput
                id="specialist-trigger-priority"
                type="number"
                min={-100}
                max={100}
                value={draft.priority}
                onBlur={() => touchField('priority')}
                onChange={(event) => updateDraft('priority', event.target.value)}
                aria-invalid={Boolean(fieldError('priority'))}
                aria-describedby={
                  fieldError('priority') ? 'specialist-trigger-priority-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Keywords"
              htmlFor="specialist-keywords"
              error={fieldError('keywords')}
              hint="Separated by commas"
            >
              <FormInput
                id="specialist-keywords"
                value={draft.keywords}
                onBlur={() => touchField('keywords')}
                onChange={(event) => updateDraft('keywords', event.target.value)}
                placeholder="planning, priorities"
                aria-invalid={Boolean(fieldError('keywords'))}
                aria-describedby={fieldError('keywords') ? 'specialist-keywords-error' : undefined}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Aliases"
              htmlFor="specialist-aliases"
              error={fieldError('aliases')}
              hint="Separated by commas"
            >
              <FormInput
                id="specialist-aliases"
                value={draft.aliases}
                onBlur={() => touchField('aliases')}
                onChange={(event) => updateDraft('aliases', event.target.value)}
                placeholder="productivity coach"
                aria-invalid={Boolean(fieldError('aliases'))}
                aria-describedby={fieldError('aliases') ? 'specialist-aliases-error' : undefined}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Intent categories"
              htmlFor="specialist-intent-categories"
              error={fieldError('intentCategories')}
              hint="Separated by commas"
              className="sm:col-span-2"
            >
              <FormInput
                id="specialist-intent-categories"
                value={draft.intentCategories}
                onBlur={() => touchField('intentCategories')}
                onChange={(event) => updateDraft('intentCategories', event.target.value)}
                placeholder="tasks, projects"
                aria-invalid={Boolean(fieldError('intentCategories'))}
                aria-describedby={
                  fieldError('intentCategories') ? 'specialist-intent-categories-error' : undefined
                }
                className="w-full"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title="Context"
          description="Choose the context and supporting memory the specialist can see."
        >
          <FormField
            label="Living-context domains"
            htmlFor="specialist-living-context"
            error={fieldError('livingContextDomains')}
            hint="Choose one or more domains from the shared assistant snapshot."
          >
            <MultiCombobox
              id="specialist-living-context"
              value={draft.livingContextDomains}
              onChange={(value) => updateDraft('livingContextDomains', value)}
              options={specialistLivingContextOptions}
              maxItems={specialistFormLimits.livingContextDomains.maxItems}
              placeholder="Search and add a context domain…"
            />
          </FormField>
          <FormField
            label="Domain-delta modules"
            htmlFor="specialist-domain-delta-modules"
            error={fieldError('domainDeltaModules')}
            hint="Separated by commas; currently supported value: content."
          >
            <FormInput
              id="specialist-domain-delta-modules"
              value={draft.domainDeltaModules}
              onBlur={() => touchField('domainDeltaModules')}
              onChange={(event) => updateDraft('domainDeltaModules', event.target.value)}
              placeholder="content"
              aria-invalid={Boolean(fieldError('domainDeltaModules'))}
              aria-describedby={
                fieldError('domainDeltaModules')
                  ? 'specialist-domain-delta-modules-error'
                  : undefined
              }
              className="w-full"
            />
          </FormField>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ['includeBrandProfile', 'Include brand profile'],
                ['includeLtm', 'Include long-term memory'],
                ['includeToolResults', 'Include main-turn tool results'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                <FormCheckbox
                  checked={draft[key]}
                  onChange={(event) => updateDraft(key, event.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection
          title="Scoped tools"
          description="Limit this specialist to safe-read tools; writes and approvals are never available."
        >
          <FormField
            label="Filter safe-read tools"
            htmlFor="specialist-tool-filter"
            hint={`${draft.toolNames.length} selected · descriptions explain each tool's scope`}
          >
            <FormInput
              id="specialist-tool-filter"
              value={toolFilter}
              onChange={(event) => setToolFilter(event.target.value)}
              placeholder="Search by tool name or description…"
              className="w-full"
            />
          </FormField>
          <div
            className={cn(
              specialistPanelClassName,
              'max-h-64 space-y-2 overflow-y-auto bg-gray-50 p-3 dark:bg-gray-900/50'
            )}
            aria-label="Safe-read tools"
          >
            {toolsLoading ? (
              <p className={cn('text-sm', specialistMutedTextClassName)}>
                Loading safe-read tools…
              </p>
            ) : filteredTools.length > 0 ? (
              filteredTools.map((tool) => (
                <label
                  key={tool.name}
                  className="flex items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-white dark:hover:bg-gray-800"
                >
                  <FormCheckbox
                    checked={draft.toolNames.includes(tool.name)}
                    onChange={(event) => toggleTool(tool.name, event.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {tool.name}
                    </span>
                    <span className={cn('ml-2 text-xs', specialistMutedTextClassName)}>
                      {tool.description}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className={cn('text-sm', specialistMutedTextClassName)}>
                {toolRegistry?.length
                  ? 'No safe-read tools match this filter.'
                  : 'No safe-read tools available.'}
              </p>
            )}
          </div>
        </FormSection>

        <FormSection
          title="Runtime"
          description="Bound the specialist's cost, latency, and context footprint."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Max read-only tool rounds"
              htmlFor="specialist-max-tool-rounds"
              error={fieldError('maxToolRounds')}
              hint="0–2 rounds"
            >
              <FormInput
                id="specialist-max-tool-rounds"
                type="number"
                min={0}
                max={2}
                value={draft.maxToolRounds}
                onBlur={() => touchField('maxToolRounds')}
                onChange={(event) => updateDraft('maxToolRounds', event.target.value)}
                aria-invalid={Boolean(fieldError('maxToolRounds'))}
                aria-describedby={
                  fieldError('maxToolRounds') ? 'specialist-max-tool-rounds-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Timeout seconds"
              htmlFor="specialist-timeout"
              error={fieldError('timeoutSeconds')}
              hint="1–60 seconds"
            >
              <FormInput
                id="specialist-timeout"
                type="number"
                min={1}
                max={60}
                value={draft.timeoutSeconds}
                onBlur={() => touchField('timeoutSeconds')}
                onChange={(event) => updateDraft('timeoutSeconds', event.target.value)}
                aria-invalid={Boolean(fieldError('timeoutSeconds'))}
                aria-describedby={
                  fieldError('timeoutSeconds') ? 'specialist-timeout-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Temperature"
              htmlFor="specialist-temperature"
              error={fieldError('temperature')}
              hint="0–1"
            >
              <FormInput
                id="specialist-temperature"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={draft.temperature}
                onBlur={() => touchField('temperature')}
                onChange={(event) => updateDraft('temperature', event.target.value)}
                aria-invalid={Boolean(fieldError('temperature'))}
                aria-describedby={
                  fieldError('temperature') ? 'specialist-temperature-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Model override"
              htmlFor="specialist-model-override"
              error={fieldError('modelOverride')}
              hint="Optional catalog id"
            >
              <FormInput
                id="specialist-model-override"
                value={draft.modelOverride}
                maxLength={specialistFormLimits.modelOverride.maxLength}
                onBlur={() => touchField('modelOverride')}
                onChange={(event) => updateDraft('modelOverride', event.target.value)}
                placeholder="Optional catalog id"
                aria-invalid={Boolean(fieldError('modelOverride'))}
                aria-describedby={
                  fieldError('modelOverride') ? 'specialist-model-override-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <FormField
              label="Context character budget"
              htmlFor="specialist-context-budget"
              error={fieldError('contextCharBudget')}
              hint="400–12,000 characters"
              className="sm:col-span-2"
            >
              <FormInput
                id="specialist-context-budget"
                type="number"
                min={400}
                max={12000}
                value={draft.contextCharBudget}
                onBlur={() => touchField('contextCharBudget')}
                onChange={(event) => updateDraft('contextCharBudget', event.target.value)}
                aria-invalid={Boolean(fieldError('contextCharBudget'))}
                aria-describedby={
                  fieldError('contextCharBudget') ? 'specialist-context-budget-error' : undefined
                }
                className="w-full"
              />
            </FormField>
          </div>
        </FormSection>

        {editingExisting ? (
          <FormSection
            title="Knowledge"
            description="Attach specialist-only references and an optional knowledge graph."
          >
            <FormField
              label="Corpus ids"
              htmlFor="specialist-corpus-ids"
              error={fieldError('corpusIds')}
              hint="Separated by commas; attached specialist corpora stay out of shared Vault search."
            >
              <FormInput
                id="specialist-corpus-ids"
                value={draft.corpusIds}
                onBlur={() => touchField('corpusIds')}
                onChange={(event) => updateDraft('corpusIds', event.target.value)}
                placeholder="Attached specialist corpora"
                aria-invalid={Boolean(fieldError('corpusIds'))}
                aria-describedby={
                  fieldError('corpusIds') ? 'specialist-corpus-ids-error' : undefined
                }
                className="w-full"
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Knowledge graph" htmlFor="specialist-graph-enabled">
                <label className="flex min-h-10 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <FormCheckbox
                    id="specialist-graph-enabled"
                    checked={draft.graphEnabled}
                    onChange={(event) => updateDraft('graphEnabled', event.target.checked)}
                  />
                  Attach the specialist knowledge graph
                </label>
              </FormField>
              <FormField
                label="Graph id"
                htmlFor="specialist-graph-id"
                error={fieldError('graphId')}
                hint="Optional graph id"
              >
                <FormInput
                  id="specialist-graph-id"
                  value={draft.graphId}
                  maxLength={specialistFormLimits.graphId.maxLength}
                  onBlur={() => touchField('graphId')}
                  onChange={(event) => updateDraft('graphId', event.target.value)}
                  placeholder="Optional graph id"
                  disabled={!draft.graphEnabled}
                  aria-invalid={Boolean(fieldError('graphId'))}
                  aria-describedby={fieldError('graphId') ? 'specialist-graph-id-error' : undefined}
                  className="w-full"
                />
              </FormField>
            </div>
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Attached PDF corpus
                </h5>
                <p className={cn('mt-1 text-xs', specialistMutedTextClassName)}>
                  Upload reference documents scoped to this specialist. They are excluded from
                  shared Vault search.
                </p>
              </div>
              <FileUploadZone
                accept=".pdf,.docx,.pptx,.txt,.md"
                extensions={['pdf', 'docx', 'pptx', 'txt', 'md']}
                multiple={false}
                maxSizeMB={25}
                onFilesSelected={onUploadDocument}
                className="rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600"
              />
              {uploadingFile ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Uploading {uploadingFile}…
                </p>
              ) : null}
              {uploadError ? (
                <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
              ) : null}
              <div className="space-y-2">
                {documentsLoading ? (
                  <p className={cn('text-sm', specialistMutedTextClassName)}>
                    Loading attached documents…
                  </p>
                ) : (
                  documents?.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                    >
                      <span className="min-w-0 truncate text-gray-800 dark:text-gray-200">
                        {document.filename}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {document.status}
                        <button
                          type="button"
                          className="rounded text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-red-300"
                          onClick={() => onDeleteDocument(document.id)}
                          disabled={deletingDocument}
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {draft.graphEnabled && specialist?.id ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <AssistantSpecialistGraphEditor specialistId={specialist.id} />
              </div>
            ) : null}
          </FormSection>
        ) : null}

        {saveError ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {saveError.message}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

export default function SpecialistFormModal({
  isOpen,
  specialist,
  ...props
}: SpecialistFormModalProps) {
  if (!isOpen) {
    return (
      <Dialog isOpen={false} onClose={props.onClose} title="Specialist" size="xl">
        {null}
      </Dialog>
    );
  }

  return <SpecialistFormFields key={specialist?.id ?? 'new'} specialist={specialist} {...props} />;
}
