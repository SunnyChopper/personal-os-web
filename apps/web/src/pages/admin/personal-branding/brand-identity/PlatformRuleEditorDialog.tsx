import { useEffect, useMemo, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Dialog from '@/components/molecules/Dialog';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import PlatformRuleSetPreviewPanel from '@/components/molecules/personal-branding/PlatformRuleSetPreviewPanel';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import { FormInput } from '@/components/atoms/FormInput';
import { FormTextarea } from './BrandIdentityFormFields';
import ProfileMultiSelect from './ProfileMultiSelect';
import RhetoricalModeSelector from '@/components/molecules/personal-branding/RhetoricalModeSelector';
import RhetoricalDeviceSelector from '@/components/molecules/personal-branding/RhetoricalDeviceSelector';
import { formatRhetoricalSelectionSummary } from '@/lib/personal-branding/platform-rule-display';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type BrandProfile,
  type CreatePlatformRuleInput,
  type PlatformRuleCatalog,
  type PlatformRuleRecord,
  type PlatformRuleSetPreviewResult,
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
  const [lastTestedFingerprint, setLastTestedFingerprint] = useState<string | null>(null);

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
      }),
    [
      platform,
      characterLimit,
      readTimeLimitMinutes,
      requirements,
      rhetoricalModes,
      rhetoricalDevices,
      profileIds,
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
    } else {
      setPlatform('linkedin');
      setName('');
      setCharacterLimit('');
      setReadTimeLimitMinutes('');
      setRequirements('');
      setRhetoricalModes([]);
      setRhetoricalDevices([]);
      setProfileIds([]);
    }
    setValidationError(null);
    setPreviewResult(null);
    setPreviewError(null);
    setLastTestedFingerprint(null);
  }, [isOpen, initial]);

  const previewStale =
    previewResult !== null &&
    lastTestedFingerprint !== null &&
    lastTestedFingerprint !== draftFingerprint;

  const handleTestRuleSet = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const limit = characterLimit.trim() ? Number(characterLimit) : null;
      const readMinutes = readTimeLimitMinutes.trim() ? Number(readTimeLimitMinutes) : null;
      const result = await personalBrandingService.previewPlatformRuleSet({
        platform,
        characterLimit: limit,
        readTimeLimitMinutes: readMinutes,
        requirements: requirements.trim() || null,
        rhetoricalModes,
        rhetoricalDevices,
        brandProfileId: profileIds[0] ?? null,
      });
      setPreviewResult(result);
      setLastTestedFingerprint(draftFingerprint);
    } catch (error) {
      setPreviewResult(null);
      setPreviewError(error instanceof Error ? error.message : 'Failed to preview rule set');
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
    if (initial) {
      await onUpdate(initial.id, body);
    } else {
      await onCreate(body);
    }
    onClose();
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
          <div>
            <label className="mb-1 block text-sm font-medium">Platform</label>
            <IconSelect
              value={platform}
              onChange={(next) => setPlatform(next as BrandPlatform)}
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
                onChange={(e) => setCharacterLimit(e.target.value)}
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
                onChange={(e) => setReadTimeLimitMinutes(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Enforced at 200 words per minute.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="platform-rule-requirements">
              Requirements <span className="text-red-600">*</span>
            </label>
            <FormTextarea
              id="platform-rule-requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
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
                  onChange={setRhetoricalModes}
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
                  onChange={setRhetoricalDevices}
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

          <PlatformRuleSetPreviewPanel
            preview={previewResult}
            isLoading={previewLoading}
            error={previewError}
            isStale={previewStale}
          />

          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleTestRuleSet}
              disabled={previewBusy}
              className="mr-auto inline-flex items-center gap-2"
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
