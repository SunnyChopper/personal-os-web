import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlaskConical, ShieldAlert } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import PlatformDefaultAppliedNotice from '@/components/molecules/personal-branding/PlatformDefaultAppliedNotice';
import PlatformRuleConsistencyPanel from '@/components/molecules/personal-branding/PlatformRuleConsistencyPanel';
import PlatformRuleSetPreviewPanel from '@/components/molecules/personal-branding/PlatformRuleSetPreviewPanel';
import PlatformRuleTemplateChips from '@/components/molecules/personal-branding/PlatformRuleTemplateChips';
import PlatformTemplateAppliedNotice from '@/components/molecules/personal-branding/PlatformTemplateAppliedNotice';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { FormInput } from '@/components/atoms/FormInput';
import { FormTextarea } from './BrandIdentityFormFields';
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
import { reportClientError } from '@/lib/client-telemetry';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type BrandProfile,
  type CreatePlatformRuleInput,
  type PlatformRuleCatalog,
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
  const [characterLimit, setCharacterLimit] = useState('');
  const [readTimeLimitMinutes, setReadTimeLimitMinutes] = useState('');
  const [requirements, setRequirements] = useState('');
  const [rhetoricalModes, setRhetoricalModes] = useState<RhetoricalModeSetting[]>([]);
  const [rhetoricalDevices, setRhetoricalDevices] = useState<RhetoricalDeviceId[]>([]);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PlatformRuleSetPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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
      setRequirements(template.requirements);
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
        characterLimit,
        readTimeLimitMinutes,
        requirements,
        rhetoricalModes,
        rhetoricalDevices,
        profileIds,
        sampleText,
      }),
    [
      platform,
      characterLimit,
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
      setCharacterLimit(initial.characterLimit != null ? String(initial.characterLimit) : '');
      setReadTimeLimitMinutes(
        initial.readTimeLimitMinutes != null ? String(initial.readTimeLimitMinutes) : ''
      );
      setRequirements(initial.requirements ?? '');
      setRhetoricalModes(initial.rhetoricalModes ?? []);
      setRhetoricalDevices(initial.rhetoricalDevices ?? []);
      setProfileIds(initial.profileIds ?? []);
      setShowPlatformDefaultHint(false);
      setSelectedTemplateId(null);
      setShowTemplateAppliedNotice(false);
    } else {
      setPlatform('linkedin');
      setName('');
      setCharacterLimit('');
      setReadTimeLimitMinutes('');
      setRequirements('');
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
    const textarea = document.getElementById('platform-rule-requirements');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
      textarea.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTestRuleSet = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setInfluences([]);
    setInfluenceError(null);
    setActiveExcerpt(null);
    try {
      const limit = characterLimit.trim() ? Number(characterLimit) : null;
      const readMinutes = readTimeLimitMinutes.trim() ? Number(readTimeLimitMinutes) : null;
      const previewInput = {
        platform,
        characterLimit: limit,
        readTimeLimitMinutes: readMinutes,
        requirements: requirements.trim() || null,
        rhetoricalModes,
        rhetoricalDevices,
        brandProfileId: profileIds[0] ?? null,
        brandProfileIds: profileIds,
        sampleText: sampleText.trim() || undefined,
      };
      const result = await personalBrandingService.previewPlatformRuleSet(previewInput);
      setPreviewResult(result);
      setLastTestedFingerprint(draftFingerprint);
      saveCustomSample(ruleSampleKey, sampleText);

      setInfluenceLoading(true);
      try {
        const influenceResult = await personalBrandingService.annotatePlatformRuleSetInfluence({
          ...previewInput,
          sampleText: result.sampleText,
          body: result.body,
        });
        setInfluences(influenceResult.appliedInfluences);
      } catch (influenceErr) {
        const message =
          influenceErr instanceof Error
            ? influenceErr.message
            : 'Rule influence analysis unavailable';
        void reportClientError({
          message: `Platform rule influence failed: ${message}`,
          source: 'web',
          metadata: {
            kind: 'personal-branding-handler',
            feature: 'brandProfileExtraction',
            action: 'ruleInfluence',
          },
        });
        setInfluences([]);
        setInfluenceError(message);
      } finally {
        setInfluenceLoading(false);
      }
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
      setInfluenceLoading(false);
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRequirements = requirements.trim();
    if (!trimmedRequirements) {
      setValidationError('Requirements are required.');
      return;
    }
    setValidationError(null);
    const limit = characterLimit.trim() ? Number(characterLimit) : null;
    const readMinutes = readTimeLimitMinutes.trim() ? Number(readTimeLimitMinutes) : null;
    const body = {
      platform,
      name: name.trim() || null,
      characterLimit: limit,
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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          {!initial && (
            <PlatformRuleTemplateChips
              selectedTemplateId={selectedTemplateId}
              onSelect={handleApplyTemplate}
              disabled={isSubmitting}
            />
          )}

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
            <label className="mb-1 block text-sm font-medium">Rule name (optional)</label>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Character limit (optional)</label>
              <FormInput
                type="number"
                min={1}
                value={characterLimit}
                onChange={(e) => {
                  setCharacterLimit(e.target.value);
                  setShowPlatformDefaultHint(false);
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Read time limit in minutes (optional)
              </label>
              <FormInput
                type="number"
                min={1}
                value={readTimeLimitMinutes}
                onChange={(e) => {
                  setReadTimeLimitMinutes(e.target.value);
                  setShowPlatformDefaultHint(false);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">Enforced at 200 words per minute.</p>
            </div>
          </div>

          {showPlatformDefaultHint && (
            <PlatformDefaultAppliedNotice onDismiss={() => setShowPlatformDefaultHint(false)} />
          )}

          {showTemplateAppliedNotice && (
            <PlatformTemplateAppliedNotice onDismiss={() => setShowTemplateAppliedNotice(false)} />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="platform-rule-requirements">
              Requirements <span className="text-red-600">*</span>
            </label>
            <FormTextarea
              id="platform-rule-requirements"
              value={requirements}
              onChange={(e) => {
                setRequirements(e.target.value);
                clearTemplateSelection();
              }}
              rows={4}
              placeholder="Writing constraints injected into the AI system prompt (tone, structure, must-include elements)."
            />
            {initial?.needsReview && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Legacy rule: add requirements before saving.
              </p>
            )}
            {validationError && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {validationError}
              </p>
            )}
          </div>

          {catalog && (
            <div className="grid gap-4 lg:grid-cols-2">
              <CollapsibleSection title="Rhetorical modes" summary={modesSummary} defaultOpen>
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
                defaultOpen
              >
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
          )}

          <ProfileMultiSelect
            profiles={profiles}
            selectedIds={profileIds}
            onChange={setProfileIds}
          />

          <PlatformRuleConsistencyPanel
            issues={consistencyDismissed ? null : consistencyIssues}
            isStale={consistencyStale}
            onAccept={handleAcceptConsistency}
            onAdjustRequirements={handleAdjustRequirements}
          />

          <PlatformRuleSetPreviewPanel
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
          />

          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCheckConsistency}
              disabled={previewBusy}
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
              disabled={previewBusy}
              className="inline-flex items-center gap-2"
            >
              <FlaskConical className="size-4" aria-hidden />
              Test this rule set
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {initial ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Dialog>
  );
}
