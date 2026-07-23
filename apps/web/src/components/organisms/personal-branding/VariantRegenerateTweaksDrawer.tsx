import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/atoms/Button';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import RhetoricalDeviceSelector from '@/components/molecules/personal-branding/RhetoricalDeviceSelector';
import RhetoricalModeSelector from '@/components/molecules/personal-branding/RhetoricalModeSelector';
import { queryKeys } from '@/lib/react-query/query-keys';
import { formatRhetoricalSelectionSummary } from '@/lib/personal-branding/platform-rule-display';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  BRAND_PLATFORM_LABELS,
  type BrandProfile,
  type ContentVariant,
  type RegenerateVariantWithTweaksInput,
  type RhetoricalDeviceId,
  type RhetoricalModeSetting,
} from '@/types/api/personal-branding.dto';
import {
  FormTextarea,
  ToneMetricsEditor,
} from '@/pages/admin/personal-branding/brand-identity/BrandIdentityFormFields';
import { normalizeToneMetrics } from '@/lib/personal-branding/profile-strength';

function formatToneMetricsSummary(values: Record<string, number>): string {
  const keys = Object.keys(values).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) return 'No metrics';
  if (keys.length <= 3) return keys.join(', ');
  return `${keys.slice(0, 2).join(', ')} +${keys.length - 2}`;
}

interface VariantRegenerateTweaksDrawerProps {
  open: boolean;
  variant: ContentVariant | null;
  profile: BrandProfile | null;
  onClose: () => void;
  onSubmit: (variantId: string, body: RegenerateVariantWithTweaksInput) => Promise<void>;
  isSubmitting?: boolean;
}

export default function VariantRegenerateTweaksDrawer({
  open,
  variant,
  profile,
  onClose,
  onSubmit,
  isSubmitting = false,
}: VariantRegenerateTweaksDrawerProps) {
  const [toneMetrics, setToneMetrics] = useState<Record<string, number>>({});
  const [rhetoricalModes, setRhetoricalModes] = useState<RhetoricalModeSetting[]>([]);
  const [rhetoricalDevices, setRhetoricalDevices] = useState<RhetoricalDeviceId[]>([]);
  const [tweakInstructions, setTweakInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const catalogQ = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.catalog(),
    queryFn: () => personalBrandingService.getPlatformRuleCatalog(),
    enabled: open,
  });

  const effectiveQ = useQuery({
    queryKey: queryKeys.personalBranding.platformRules.effective(
      variant?.platform ?? 'linkedin',
      variant?.brandProfileId
    ),
    queryFn: () =>
      personalBrandingService.getEffectivePlatformRules(variant!.platform, variant!.brandProfileId),
    enabled: open && Boolean(variant),
  });

  const seedTone = useMemo(
    () => normalizeToneMetrics(profile?.toneMetrics ?? {}),
    [profile?.toneMetrics]
  );
  const seedModes = effectiveQ.data?.resolvedPolicy.rhetoricalModes ?? [];
  const seedDevices = effectiveQ.data?.resolvedPolicy.rhetoricalDevices ?? [];

  useEffect(() => {
    if (!open || !variant) return;
    setToneMetrics(seedTone);
    setRhetoricalModes(seedModes);
    setRhetoricalDevices(seedDevices);
    setTweakInstructions('');
    setValidationError(null);
  }, [open, variant, seedTone, seedModes, seedDevices]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!variant) return;

    const instructions = tweakInstructions.trim();
    const hasTone = Object.keys(toneMetrics).length > 0;
    const hasModes = rhetoricalModes.length > 0;
    const hasDevices = rhetoricalDevices.length > 0;
    const hasInstructions = Boolean(instructions);

    if (!hasTone && !hasModes && !hasDevices && !hasInstructions) {
      setValidationError(
        'Adjust tone metrics, rhetorical modes/devices, or add iteration instructions.'
      );
      return;
    }

    setValidationError(null);
    const body: RegenerateVariantWithTweaksInput = {};
    if (hasTone) body.toneMetrics = toneMetrics;
    if (hasModes) body.rhetoricalModes = rhetoricalModes;
    if (hasDevices) body.rhetoricalDevices = rhetoricalDevices;
    if (hasInstructions) body.tweakInstructions = instructions;

    await onSubmit(variant.id, body);
  };

  const toneSummary = useMemo(() => formatToneMetricsSummary(toneMetrics), [toneMetrics]);

  const modesSummary = useMemo(
    () =>
      formatRhetoricalSelectionSummary(
        rhetoricalModes.map((entry) => entry.mode),
        catalogQ.data?.modes
      ),
    [rhetoricalModes, catalogQ.data?.modes]
  );

  const devicesSummary = useMemo(
    () => formatRhetoricalSelectionSummary(rhetoricalDevices, catalogQ.data?.devices),
    [rhetoricalDevices, catalogQ.data?.devices]
  );

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      ariaLabel="Regenerate variant with tweaks"
      title="Regenerate with tweaks"
      maxWidth="xl"
      panelClassName="flex flex-col"
    >
      {variant ? (
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Re-run adaptation for{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {BRAND_PLATFORM_LABELS[variant.platform]}
            </span>{' '}
            using your tone and rhetorical adjustments. The current variant stays; a new sibling is
            created.
          </p>

          <CollapsibleSection title="Tone metrics" summary={toneSummary} defaultOpen>
            <ToneMetricsEditor
              values={toneMetrics}
              onChange={setToneMetrics}
              disabled={isSubmitting}
              density="compact"
              hideTitle
            />
          </CollapsibleSection>

          {catalogQ.data ? (
            <>
              <CollapsibleSection
                title="Rhetorical modes"
                summary={modesSummary}
                defaultOpen={false}
              >
                <RhetoricalModeSelector
                  catalog={catalogQ.data.modes}
                  strengths={catalogQ.data.strengths}
                  value={rhetoricalModes}
                  onChange={setRhetoricalModes}
                  disabled={isSubmitting}
                  hideLegend
                  density="compact"
                />
              </CollapsibleSection>
              <CollapsibleSection
                title="Rhetorical devices"
                summary={devicesSummary}
                defaultOpen={false}
              >
                <RhetoricalDeviceSelector
                  catalog={catalogQ.data.devices}
                  value={rhetoricalDevices}
                  onChange={setRhetoricalDevices}
                  disabled={isSubmitting}
                  hideLegend
                  density="compact"
                />
              </CollapsibleSection>
            </>
          ) : catalogQ.isPending ? (
            <p className="text-sm text-gray-500">Loading rhetorical catalog…</p>
          ) : null}

          <div>
            <label
              htmlFor="variant-tweak-instructions"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Iteration instructions (optional)
            </label>
            <FormTextarea
              id="variant-tweak-instructions"
              value={tweakInstructions}
              onChange={(e) => setTweakInstructions(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder="e.g. Sharpen the hook, shorten the opening, lean more contrarian…"
            />
          </div>

          {validationError ? (
            <p className="text-sm text-red-600" role="alert">
              {validationError}
            </p>
          ) : null}

          <div className="mt-auto flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || effectiveQ.isPending}>
              {isSubmitting ? 'Regenerating…' : 'Regenerate'}
            </Button>
          </div>
        </form>
      ) : null}
    </SlideDrawer>
  );
}
