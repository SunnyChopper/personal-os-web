import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, ShieldAlert } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import PlatformDefaultAppliedNotice from '@/components/molecules/personal-branding/PlatformDefaultAppliedNotice';
import PlatformRuleConsistencyPanel from '@/components/molecules/personal-branding/PlatformRuleConsistencyPanel';
import PlatformRuleSetPreviewPanel from '@/components/molecules/personal-branding/PlatformRuleSetPreviewPanel';
import PlatformRuleTemplateChips from '@/components/molecules/personal-branding/PlatformRuleTemplateChips';
import OrderedStringListEditor from '@/components/molecules/personal-branding/OrderedStringListEditor';
import PlatformTemplateAppliedNotice from '@/components/molecules/personal-branding/PlatformTemplateAppliedNotice';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { FormInput } from '@/components/atoms/FormInput';
import ProfileMultiSelect from './ProfileMultiSelect';
import RhetoricalModeSelector from '@/components/molecules/personal-branding/RhetoricalModeSelector';
import RhetoricalDeviceSelector from '@/components/molecules/personal-branding/RhetoricalDeviceSelector';
import { formatRhetoricalSelectionSummary } from '@/lib/personal-branding/platform-rule-display';
import {
  checkPlatformRuleToneConsistency,
  type ConsistencyIssue,
} from '@/lib/personal-branding/platform-rule-tone-consistency';
import {
  formatLimitFieldsFromDefault,
  getPlatformLimitDefault,
  shouldReplaceLimitsWithPlatformDefaults,
} from '@/lib/personal-branding/platform-limit-defaults';
import {
  getPlatformRuleTemplate,
  type PlatformRuleTemplateId,
} from '@/lib/personal-branding/platform-rule-templates';
import {
  loadCustomSample,
  PLATFORM_RULE_SET_DRAFT_SAMPLE_KEY,
  PLATFORM_RULE_SET_SAMPLE_TEXT,
  saveCustomSample,
} from '@/lib/personal-branding/platform-rule-set-sample';
import { personalBrandingService } from '@/services/personal-branding.service';
import { usePlatformRulePreviewJob } from '@/hooks/usePlatformRulePreviewJob';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { reportClientError } from '@/lib/client-telemetry';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type BrandProfile,
  type CreatePlatformRuleInput,
  type PlatformRuleCatalog,
  type PlatformRulePreviewJob,
  type PlatformRuleRecord,
  type PlatformRuleSetPreviewResult,
  type PlatformRuleSetInfluenceItem,
  type RhetoricalDeviceId,
  type RhetoricalModeSetting,
  type UpdatePlatformRuleInput,
} from '@/types/api/personal-branding.dto';
import { BrandPlatformIcon } from '@/components/atoms/BrandPlatformIcon';
import IconSelect from '@/components/molecules/IconSelect';

const PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

const PLATFORM_OPTIONS = PLATFORMS.map((platform) => ({
  value: platform,
  label: BRAND_PLATFORM_LABELS[platform],
  icon: <BrandPlatformIcon platform={platform} className="h-4 w-4" />,
}));

function normalizeRequirementList(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return (value ?? '')
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function parseOptionalPositiveInteger(value: string): { value: number | null; valid: boolean } {
  if (!value.trim()) return { value: null, valid: true };
  const parsed = Number(value);
  return {
    value: Number.isInteger(parsed) && parsed >= 1 ? parsed : null,
    valid: Number.isInteger(parsed) && parsed >= 1,
  };
}

interface PlatformRuleEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: BrandProfile[];
  catalog: PlatformRuleCatalog | undefined;
  initial?: PlatformRuleRecord | null;
  onCreate: (body: CreatePlatformRuleInput) => Promise<void>;
  onUpdate: (id: string, body: UpdatePlatformRuleInput) => Promise<void>;
  isSubmitting?: boolean;
}

export default function PlatformRuleEditorDialog({
  isOpen,
  onClose,
  profiles,
  catalog,
  initial,
  onCreate,
  onUpdate,
  isSubmitting = false,
}: PlatformRuleEditorDialogProps) {
  const [platform, setPlatform] = useState<BrandPlatform>('linkedin');
  const [name, setName] = useState('');
  const [characterMinimum, setCharacterMinimum] = useState('');
  const [characterLimit, setCharacterLimit] = useState('');
  const [readTimeMinimumMinutes, setReadTimeMinimumMinutes] = useState('');
  const [readTimeLimitMinutes, setReadTimeLimitMinutes] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [rhetoricalModes, setRhetoricalModes] = useState<RhetoricalModeSetting[]>([]);
  const [rhetoricalDevices, setRhetoricalDevices] = useState<RhetoricalDeviceId[]>([]);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PlatformRuleSetPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [influences, setInfluences] = useState<PlatformRuleSetInfluenceItem[]>([]);
  const [influenceError, setInfluenceError] = useState<string | null>(null);
  const [influenceLoading, setInfluenceLoading] = useState(false);
  const [activeExcerpt, setActiveExcerpt] = useState<string | null>(null);
  const [lastTestedFingerprint, setLastTestedFingerprint] = useState<string | null>(null);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[] | null>(null);
  const [lastCheckedFingerprint, setLastCheckedFingerprint] = useState<string | null>(null);
  const [consistencyDismissed, setConsistencyDismissed] = useState(false);
  const [showPlatformDefaultHint, setShowPlatformDefaultHint] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<PlatformRuleTemplateId | null>(null);
  const [showTemplateAppliedNotice, setShowTemplateAppliedNotice] = useState(false);
  const [sampleText, setSampleText] = useState(PLATFORM_RULE_SET_SAMPLE_TEXT);

  const ruleSampleKey = initial?.id ?? PLATFORM_RULE_SET_DRAFT_SAMPLE_KEY;
  const previewFingerprintRef = useRef<string | null>(null);

  const handlePreviewTerminal = useCallback(
    (job: PlatformRulePreviewJob) => {
      setPreviewLoading(false);
      window.sessionStorage.removeItem(`platform-rule-preview-job:${ruleSampleKey}`);
      if (job.status === 'succeeded' && job.result) {
        setPreviewResult(job.result);
        setInfluences(job.result.appliedInfluences ?? []);
        setInfluenceError(null);
        setLastTestedFingerprint(previewFingerprintRef.current);
      } else if (job.status === 'failed') {
        setPreviewError(job.error ?? 'Failed to preview rule set');
      } else if (job.status === 'cancelled') {
        setPreviewError('Preview cancelled.');
      }
    },
    [ruleSampleKey]
  );

  const previewJobQuery = usePlatformRulePreviewJob(previewJobId, handlePreviewTerminal, () =>
    setPreviewError('Preview timed out while waiting for the worker.')
  );

  useTerminalJobFailureAlert({
    feature: 'platformRuleSetPreview',
    jobId: previewJobId,
    status: previewJobQuery.data?.status,
    error: previewJobQuery.data?.error,
    message: previewJobQuery.data?.message,
    stage: previewJobQuery.data?.stage,
  });

  const applyPlatformLimitDefaults = useCallback(
    (nextPlatform: BrandPlatform) => {
      const defaults = getPlatformLimitDefault(nextPlatform, catalog);
      if (!defaults) {
        return false;
      }
      const formatted = formatLimitFieldsFromDefault(defaults);
      setCharacterLimit(formatted.characterLimit);
      setReadTimeLimitMinutes(formatted.readTimeLimitMinutes);
      setShowPlatformDefaultHint(true);
      return true;
    },
    [catalog]
  );

  const handlePlatformChange = useCallback(
    (next: BrandPlatform) => {
      if (
        shouldReplaceLimitsWithPlatformDefaults({
          previousPlatform: platform,
          nextPlatform: next,
          characterLimit,
          readTimeLimitMinutes,
          catalog,
        })
      ) {
        applyPlatformLimitDefaults(next);
      }
      setSelectedTemplateId(null);
      setShowTemplateAppliedNotice(false);
      setPlatform(next);
    },
    [applyPlatformLimitDefaults, catalog, characterLimit, platform, readTimeLimitMinutes]
  );

  const handleApplyTemplate = useCallback(
    (templateId: PlatformRuleTemplateId) => {
      if (selectedTemplateId === templateId) {
        return;
      }

      const template = getPlatformRuleTemplate(templateId);
      setPlatform(template.platform);
      setName(template.name);
      setRequirements(normalizeRequirementList(template.requirements));
      setRhetoricalModes(template.rhetoricalModes);
      setRhetoricalDevices(template.rhetoricalDevices);
      applyPlatformLimitDefaults(template.platform);
      setSelectedTemplateId(templateId);
      setShowTemplateAppliedNotice(true);
      setValidationError(null);
      setPreviewResult(null);
      setPreviewError(null);
      setLastTestedFingerprint(null);
    },
    [applyPlatformLimitDefaults, selectedTemplateId]
  );

  const clearTemplateSelection = useCallback(() => {
    setSelectedTemplateId(null);
    setShowTemplateAppliedNotice(false);
  }, []);

  const draftFingerprint = useMemo(
    () =>
      JSON.stringify({
        platform,
        characterMinimum,
        characterLimit,
        readTimeMinimumMinutes,
        readTimeLimitMinutes,
        requirements,
        rhetoricalModes,
        rhetoricalDevices,
        profileIds,
        sampleText,
      }),
    [
      platform,
      characterMinimum,
      characterLimit,
      readTimeMinimumMinutes,
      readTimeLimitMinutes,
      requirements,
      rhetoricalModes,
      rhetoricalDevices,
      profileIds,
      sampleText,
    ]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setPlatform(initial.platform);
      setName(initial.name ?? '');
      setCharacterMinimum(initial.characterMinimum != null ? String(initial.characterMinimum) : '');
      setCharacterLimit(initial.characterLimit != null ? String(initial.characterLimit) : '');
      setReadTimeMinimumMinutes(
        initial.readTimeMinimumMinutes != null ? String(initial.readTimeMinimumMinutes) : ''
      );
      setReadTimeLimitMinutes(
        initial.readTimeLimitMinutes != null ? String(initial.readTimeLimitMinutes) : ''
      );
      setRequirements(normalizeRequirementList(initial.requirements));
      setRhetoricalModes(initial.rhetoricalModes ?? []);
      setRhetoricalDevices(initial.rhetoricalDevices ?? []);
      setProfileIds(initial.profileIds ?? []);
      setShowPlatformDefaultHint(false);
      setSelectedTemplateId(null);
      setShowTemplateAppliedNotice(false);
    } else {
      setPlatform('linkedin');
      setName('');
      setCharacterMinimum('');
      setCharacterLimit('');
      setReadTimeMinimumMinutes('');
      setReadTimeLimitMinutes('');
      setRequirements([]);
      setRhetoricalModes([]);
      setRhetoricalDevices([]);
      setProfileIds([]);
      setShowPlatformDefaultHint(false);
      setSelectedTemplateId(null);
      setShowTemplateAppliedNotice(false);
    }
    setValidationError(null);
    setPreviewResult(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setPreviewJobId(null);
    previewFingerprintRef.current = null;
    setInfluences([]);
    setInfluenceError(null);
    setInfluenceLoading(false);
    setActiveExcerpt(null);
    setLastTestedFingerprint(null);
    setConsistencyIssues(null);
    setLastCheckedFingerprint(null);
    setConsistencyDismissed(false);
    const sampleKey = initial?.id ?? PLATFORM_RULE_SET_DRAFT_SAMPLE_KEY;
    setSampleText(loadCustomSample(sampleKey) ?? PLATFORM_RULE_SET_SAMPLE_TEXT);
    const savedJob = window.sessionStorage.getItem(`platform-rule-preview-job:${sampleKey}`);
    if (savedJob) {
      try {
        const parsed = JSON.parse(savedJob) as { jobId?: string; fingerprint?: string };
        if (parsed.jobId) {
          previewFingerprintRef.current = parsed.fingerprint ?? null;
          setPreviewJobId(parsed.jobId);
          setPreviewLoading(true);
          setLastTestedFingerprint(parsed.fingerprint ?? null);
        }
      } catch {
        window.sessionStorage.removeItem(`platform-rule-preview-job:${sampleKey}`);
      }
    }
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      saveCustomSample(ruleSampleKey, sampleText);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [isOpen, ruleSampleKey, sampleText]);

  useEffect(() => {
    if (!isOpen || initial || !catalog) return;
    if (characterLimit.trim() || readTimeLimitMinutes.trim()) return;
    applyPlatformLimitDefaults(platform);
  }, [
    applyPlatformLimitDefaults,
    catalog,
    characterLimit,
    initial,
    isOpen,
    platform,
    readTimeLimitMinutes,
  ]);

  const previewStale =
    previewResult !== null &&
    lastTestedFingerprint !== null &&
    lastTestedFingerprint !== draftFingerprint;

  useEffect(() => {
    if (!previewStale) {
      return;
    }
    setInfluences([]);
    setInfluenceError(null);
    setInfluenceLoading(false);
    setActiveExcerpt(null);
  }, [previewStale]);

  const consistencyStale =
    consistencyIssues !== null &&
    lastCheckedFingerprint !== null &&
    lastCheckedFingerprint !== draftFingerprint;

  const mappedProfiles = useMemo(
    () => profiles.filter((profile) => profileIds.includes(profile.id)),
    [profiles, profileIds]
  );

  const handleCheckConsistency = () => {
    const issues = checkPlatformRuleToneConsistency({
      requirements,
      rhetoricalModes,
      rhetoricalDevices,
      catalog,
      profiles: mappedProfiles,
    });
    setConsistencyIssues(issues);
    setLastCheckedFingerprint(draftFingerprint);
    setConsistencyDismissed(false);
  };

  const handleAcceptConsistency = () => {
    setConsistencyDismissed(true);
  };

  const handleAdjustRequirements = () => {
    const textarea = document.getElementById('requirements-new-item');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
      textarea.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTestRuleSet = async () => {
    setPreviewError(null);
    setInfluences([]);
    setInfluenceError(null);
    setActiveExcerpt(null);
    try {
      const parsedCharacterMinimum = parseOptionalPositiveInteger(characterMinimum);
      const parsedCharacterLimit = parseOptionalPositiveInteger(characterLimit);
      const parsedReadMinimum = parseOptionalPositiveInteger(readTimeMinimumMinutes);
      const parsedReadLimit = parseOptionalPositiveInteger(readTimeLimitMinutes);
      if (
        !parsedCharacterMinimum.valid ||
        !parsedCharacterLimit.valid ||
        !parsedReadMinimum.valid ||
        !parsedReadLimit.valid
      ) {
        setPreviewError('Targets must be whole numbers of at least 1.');
        return;
      }
      const characterMinimumValue = parsedCharacterMinimum.value;
      const limit = parsedCharacterLimit.value;
      const readMinimum = parsedReadMinimum.value;
      const readMinutes = parsedReadLimit.value;
      if (
        (characterMinimumValue != null && limit != null && characterMinimumValue > limit) ||
        (readMinimum != null && readMinutes != null && readMinimum > readMinutes)
      ) {
        setPreviewError('Minimum targets must be less than or equal to maximum targets.');
        return;
      }
      setPreviewLoading(true);
      const previewInput = {
        platform,
        characterMinimum: characterMinimumValue,
        characterLimit: limit,
        readTimeMinimumMinutes: readMinimum,
        readTimeLimitMinutes: readMinutes,
        requirements: requirements.map((item) => item.trim()).filter(Boolean),
        rhetoricalModes,
        rhetoricalDevices,
        brandProfileId: profileIds[0] ?? null,
        brandProfileIds: profileIds,
        sampleText: sampleText.trim() || undefined,
      };
      const start = await personalBrandingService.previewPlatformRuleSet(previewInput);
      previewFingerprintRef.current = draftFingerprint;
      setPreviewJobId(start.jobId);
      window.sessionStorage.setItem(
        `platform-rule-preview-job:${ruleSampleKey}`,
        JSON.stringify({ jobId: start.jobId, fingerprint: draftFingerprint })
      );
      saveCustomSample(ruleSampleKey, sampleText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to preview rule set';
      void reportClientError({
        message: `Platform rule preview failed: ${message}`,
        source: 'web',
        metadata: {
          kind: 'personal-branding-handler',
          feature: 'brandProfileExtraction',
          action: 'rulePreview',
        },
      });
      setPreviewResult(null);
      setInfluences([]);
      setInfluenceError(null);
      setPreviewError(message);
      setPreviewJobId(null);
    } finally {
      // The polling hook clears loading when the durable job reaches a terminal state.
    }
  };

  const handleCancelPreview = async () => {
    if (!previewJobId) return;
    try {
      const job = await personalBrandingService.cancelPlatformRulePreviewJob(previewJobId);
      if (job.status === 'cancelled') {
        handlePreviewTerminal(job);
      } else {
        setPreviewError(job.message ?? 'Cancelling preview…');
      }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to cancel preview');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRequirements = requirements.map((item) => item.trim());
    if (!trimmedRequirements.length || trimmedRequirements.some((item) => !item)) {
      setValidationError('Add at least one non-blank requirement.');
      return;
    }
    if (trimmedRequirements.length > 20) {
      setValidationError('Requirements are limited to 20 items.');
      return;
    }
    if (trimmedRequirements.some((item) => item.length > 500)) {
      setValidationError('Each requirement must be 500 characters or fewer.');
      return;
    }
    if (trimmedRequirements.reduce((total, item) => total + item.length, 0) > 8000) {
      setValidationError('Requirements must total 8,000 characters or fewer.');
      return;
    }
    if (
      new Set(trimmedRequirements.map((item) => item.toLocaleLowerCase())).size !==
      trimmedRequirements.length
    ) {
      setValidationError('Requirements must not contain duplicates.');
      return;
    }
    setValidationError(null);
    const parsedCharacterMinimum = parseOptionalPositiveInteger(characterMinimum);
    const parsedCharacterLimit = parseOptionalPositiveInteger(characterLimit);
    const parsedReadMinimum = parseOptionalPositiveInteger(readTimeMinimumMinutes);
    const parsedReadLimit = parseOptionalPositiveInteger(readTimeLimitMinutes);
    if (
      !parsedCharacterMinimum.valid ||
      !parsedCharacterLimit.valid ||
      !parsedReadMinimum.valid ||
      !parsedReadLimit.valid
    ) {
      setValidationError('Targets must be whole numbers of at least 1.');
      return;
    }
    const characterMinimumValue = parsedCharacterMinimum.value;
    const limit = parsedCharacterLimit.value;
    const readMinimum = parsedReadMinimum.value;
    const readMinutes = parsedReadLimit.value;
    if (
      (characterMinimumValue != null && limit != null && characterMinimumValue > limit) ||
      (readMinimum != null && readMinutes != null && readMinimum > readMinutes)
    ) {
      setValidationError('Minimum targets must be less than or equal to maximum targets.');
      return;
    }
    const body = {
      platform,
      name: name.trim() || null,
      characterMinimum: characterMinimumValue,
      characterLimit: limit,
      readTimeMinimumMinutes: readMinimum,
      readTimeLimitMinutes: readMinutes,
      rhetoricalModes,
      rhetoricalDevices,
      requirements: trimmedRequirements,
      profileIds,
    };
    try {
      if (initial) {
        await onUpdate(initial.id, body);
      } else {
        await onCreate(body);
      }
      onClose();
    } catch {
      // Parent toasts the failure; keep dialog open for retry.
      // Without this catch, rethrown mutateAsync errors become unhandledrejection
      // (alerts 9ada7a942ca1 / 4b0b17740a3c) after MutationCache already reported.
    }
  };

  const modesSummary = useMemo(
    () =>
      formatRhetoricalSelectionSummary(
        rhetoricalModes.map((entry) => entry.mode),
        catalog?.modes
      ),
    [rhetoricalModes, catalog?.modes]
  );

  const devicesSummary = useMemo(
    () => formatRhetoricalSelectionSummary(rhetoricalDevices, catalog?.devices),
    [rhetoricalDevices, catalog?.devices]
  );

  const previewBusy = previewLoading || isSubmitting;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit platform rule' : 'New platform rule'}
      size="xl"
      trapFocus
      footer={
        <DialogFooter className="border-0 pt-0">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCheckConsistency}
            disabled={previewBusy || isSubmitting}
            className="mr-auto inline-flex items-center gap-2"
          >
            <ShieldAlert className="size-4" aria-hidden />
            Check consistency
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleTestRuleSet}
            disabled={previewBusy || isSubmitting}
            className="inline-flex items-center gap-2"
          >
            <FlaskConical className="size-4" aria-hidden />
            Test this rule set
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" form="platform-rule-form" disabled={isSubmitting}>
            {initial ? 'Save changes' : 'Create rule'}
          </Button>
        </DialogFooter>
      }
    >
      <form id="platform-rule-form" onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          {!initial && (
            <PlatformRuleTemplateChips
              selectedTemplateId={selectedTemplateId}
              onSelect={handleApplyTemplate}
              disabled={isSubmitting}
            />
          )}

          <CollapsibleSection title="Scope" defaultOpen>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Platform</label>
                <IconSelect
                  value={platform}
                  onChange={(next) => handlePlatformChange(next as BrandPlatform)}
                  options={PLATFORM_OPTIONS}
                  aria-label="Platform"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="platform-rule-name" className="mb-1 block text-sm font-medium">
                  Rule name (optional)
                </label>
                <FormInput
                  id="platform-rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <ProfileMultiSelect
                profiles={profiles}
                selectedIds={profileIds}
                onChange={setProfileIds}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Length target" defaultOpen>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="platform-rule-character-minimum"
                  className="mb-1 block text-sm font-medium"
                >
                  Minimum characters (optional)
                </label>
                <FormInput
                  id="platform-rule-character-minimum"
                  type="number"
                  min={1}
                  step={1}
                  value={characterMinimum}
                  onChange={(e) => {
                    setCharacterMinimum(e.target.value);
                    setShowPlatformDefaultHint(false);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="platform-rule-character-limit"
                  className="mb-1 block text-sm font-medium"
                >
                  Maximum characters (optional)
                </label>
                <FormInput
                  id="platform-rule-character-limit"
                  type="number"
                  min={1}
                  step={1}
                  value={characterLimit}
                  onChange={(e) => {
                    setCharacterLimit(e.target.value);
                    setShowPlatformDefaultHint(false);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="platform-rule-read-time-minimum"
                  className="mb-1 block text-sm font-medium"
                >
                  Minimum read time in minutes (optional)
                </label>
                <FormInput
                  id="platform-rule-read-time-minimum"
                  type="number"
                  min={1}
                  step={1}
                  value={readTimeMinimumMinutes}
                  onChange={(e) => {
                    setReadTimeMinimumMinutes(e.target.value);
                    setShowPlatformDefaultHint(false);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="platform-rule-read-time-limit"
                  className="mb-1 block text-sm font-medium"
                >
                  Maximum read time in minutes (optional)
                </label>
                <FormInput
                  id="platform-rule-read-time-limit"
                  type="number"
                  min={1}
                  step={1}
                  value={readTimeLimitMinutes}
                  onChange={(e) => {
                    setReadTimeLimitMinutes(e.target.value);
                    setShowPlatformDefaultHint(false);
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Targets are checked during critique at 200 words per minute; generated Markdown is
              never cut off.
            </p>
          </CollapsibleSection>

          {showPlatformDefaultHint && (
            <PlatformDefaultAppliedNotice onDismiss={() => setShowPlatformDefaultHint(false)} />
          )}

          {showTemplateAppliedNotice && (
            <PlatformTemplateAppliedNotice onDismiss={() => setShowTemplateAppliedNotice(false)} />
          )}

          <CollapsibleSection
            title="Requirements"
            summary={`${requirements.length} item${requirements.length === 1 ? '' : 's'}`}
            defaultOpen
          >
            <OrderedStringListEditor
              label="Requirements"
              values={requirements}
              onChange={(next) => {
                setRequirements(next);
                clearTemplateSelection();
              }}
              placeholder="One requirement the draft must follow"
              addLabel="Add requirement"
              disabled={isSubmitting}
            />
            {initial?.needsReview && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Legacy rule: add requirements before saving.
              </p>
            )}
            {validationError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {validationError}
              </p>
            )}
          </CollapsibleSection>

          {catalog && (
            <CollapsibleSection
              title="Writing craft"
              summary={`${modesSummary} · ${devicesSummary}`}
              defaultOpen
            >
              <div className="space-y-4">
                <CollapsibleSection title="Rhetorical modes" summary={modesSummary} defaultOpen>
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                    Modes expose strength after selection.
                  </p>
                  <RhetoricalModeSelector
                    catalog={catalog.modes}
                    strengths={catalog.strengths}
                    value={rhetoricalModes}
                    onChange={(next) => {
                      setRhetoricalModes(next);
                      clearTemplateSelection();
                    }}
                    disabled={isSubmitting}
                    hideLegend
                  />
                </CollapsibleSection>
                <CollapsibleSection
                  title="Allowed rhetorical devices"
                  summary={devicesSummary}
                  defaultOpen={false}
                >
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                    Devices are an allowlist and do not have strength controls.
                  </p>
                  <RhetoricalDeviceSelector
                    catalog={catalog.devices}
                    value={rhetoricalDevices}
                    onChange={(next) => {
                      setRhetoricalDevices(next);
                      clearTemplateSelection();
                    }}
                    disabled={isSubmitting}
                    hideLegend
                  />
                </CollapsibleSection>
              </div>
            </CollapsibleSection>
          )}

          <PlatformRuleConsistencyPanel
            issues={consistencyDismissed ? null : consistencyIssues}
            isStale={consistencyStale}
            onAccept={handleAcceptConsistency}
            onAdjustRequirements={handleAdjustRequirements}
          />

          <PlatformRuleSetPreviewPanel
            platform={platform}
            sampleText={sampleText}
            onSampleTextChange={setSampleText}
            preview={previewResult}
            isLoading={previewLoading}
            error={previewError}
            isStale={previewStale}
            influences={influences}
            influenceLoading={influenceLoading}
            influenceError={influenceError}
            activeExcerpt={activeExcerpt}
            onSelectExcerpt={setActiveExcerpt}
            jobStage={previewJobQuery.data?.stage}
            onCancel={previewLoading ? handleCancelPreview : undefined}
            onRetry={handleTestRuleSet}
          />
        </fieldset>
      </form>
    </Dialog>
  );
}
