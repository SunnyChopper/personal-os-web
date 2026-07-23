import { useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import PlatformRulePolicySummary from '@/components/molecules/personal-branding/PlatformRulePolicySummary';
import { cn } from '@/lib/utils';
import { linkAccentClassName, statusPillClassName } from '../personal-branding-ui';
import { useToast } from '@/hooks/use-toast';
import type { usePersonalBrandingBrandIdentity } from '@/hooks/usePersonalBrandingBrandIdentity';
import PlatformRuleEditorDialog from './PlatformRuleEditorDialog';
import {
  BRAND_PLATFORM_LABELS,
  type BrandPlatform,
  type PlatformRuleRecord,
} from '@/types/api/personal-branding.dto';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { PageCard } from '../PersonalBrandingPageTemplate';

type BrandIdentityHook = ReturnType<typeof usePersonalBrandingBrandIdentity>;

interface PlatformRulesTabPanelProps {
  brandIdentity: BrandIdentityHook;
}

function ruleScopeLabel(rule: PlatformRuleRecord, profileNameById: Map<string, string>) {
  if (rule.isUniversal) {
    return <span className={statusPillClassName('info')}>Universal fallback</span>;
  }
  const names = rule.profileIds.map((id) => profileNameById.get(id)).filter(Boolean) as string[];
  return (
    <span className={statusPillClassName('info')}>
      Profiles: {names.length ? names.join(', ') : rule.profileIds.join(', ')}
    </span>
  );
}

export default function PlatformRulesTabPanel({ brandIdentity }: PlatformRulesTabPanelProps) {
  const { showToast, ToastContainer } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PlatformRuleRecord | null>(null);

  const {
    profiles,
    platformRules,
    platformRuleCatalog,
    createPlatformRule,
    updatePlatformRule,
    deletePlatformRule,
  } = brandIdentity;

  const profileList = profiles.data?.data ?? [];
  const rules = platformRules.data?.data ?? [];

  const profileNameById = useMemo(
    () => new Map(profileList.map((p) => [p.id, p.name])),
    [profileList]
  );

  const grouped = useMemo(() => {
    const map = new Map<BrandPlatform, PlatformRuleRecord[]>();
    for (const rule of rules) {
      const list = map.get(rule.platform) ?? [];
      list.push(rule);
      map.set(rule.platform, list);
    }
    return map;
  }, [rules]);

  const openCreate = () => {
    setEditingRule(null);
    setEditorOpen(true);
  };

  const openEdit = (rule: PlatformRuleRecord) => {
    setEditingRule(rule);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Platform Rules</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Writing policy per channel: limits, rhetorical controls, and requirements for AI
            generation. Rules without profile mappings apply universally.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          New rule
        </Button>
      </div>

      {!rules.length && (
        <PageCard
          className={cn(emptyStateCardClassName, 'p-8 text-sm text-gray-600 dark:text-gray-400')}
        >
          No platform rules yet. Create one to define character limits, read time, and writing
          requirements.
        </PageCard>
      )}

      {Array.from(grouped.entries()).map(([platform, platformRulesList]) => (
        <PageCard key={platform} className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {BRAND_PLATFORM_LABELS[platform]}
          </h3>
          <div className="grid gap-3">
            {platformRulesList.map((rule) => (
              <article key={rule.id} className={cn(gridItemCardClassName, 'p-4')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rule.name || 'Untitled rule'}
                    </h4>
                    <div className="mt-1">{ruleScopeLabel(rule, profileNameById)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(rule)}
                      className={cn('text-sm', linkAccentClassName)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Delete this rule?')) return;
                        try {
                          await deletePlatformRule.mutateAsync(rule.id);
                          showToast({ type: 'success', title: 'Rule deleted' });
                        } catch (err) {
                          showToast({
                            type: 'error',
                            title: err instanceof Error ? err.message : 'Delete failed',
                          });
                        }
                      }}
                      className="text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <PlatformRulePolicySummary
                  className="mt-4"
                  characterLimit={rule.characterLimit}
                  readTimeLimitMinutes={rule.readTimeLimitMinutes}
                  rhetoricalModes={rule.rhetoricalModes}
                  rhetoricalDevices={rule.rhetoricalDevices}
                  requirements={rule.requirements}
                  needsReview={rule.needsReview}
                  catalog={platformRuleCatalog.data}
                />
              </article>
            ))}
          </div>
        </PageCard>
      ))}

      <PlatformRuleEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        profiles={profileList}
        catalog={platformRuleCatalog.data}
        initial={editingRule}
        isSubmitting={createPlatformRule.isPending || updatePlatformRule.isPending}
        onCreate={async (body) => {
          try {
            await createPlatformRule.mutateAsync(body);
            showToast({ type: 'success', title: 'Rule created' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Create failed',
            });
            throw err;
          }
        }}
        onUpdate={async (id, body) => {
          try {
            await updatePlatformRule.mutateAsync({ id, body });
            showToast({ type: 'success', title: 'Rule updated' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Update failed',
            });
            throw err;
          }
        }}
      />
      <ToastContainer />
    </div>
  );
}
