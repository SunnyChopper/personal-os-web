import { useEffect, useState } from 'react';
import { Loader2, Sparkles, FlaskConical } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/templates/PageContainer';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { MultiSelectVaultCombobox } from '@/components/molecules/MultiSelectVaultCombobox';
import ProjectLabIdeaCard from '@/components/organisms/ProjectLabIdeaCard';
import ConvertToProjectIdeaDialog from '@/components/organisms/ConvertToProjectIdeaDialog';
import RejectIdeaModal from '@/pages/admin/personal-branding/content-workbench/RejectIdeaModal';
import { projectLabsService } from '@/services/knowledge-vault/project-labs.service';
import { personalBrandingService } from '@/services/personal-branding.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { ProjectLabIdea, ProjectLabIdeaStatus } from '@/types/api/project-labs.dto';
import type { VaultItemType } from '@/types/knowledge-vault';
import { cn } from '@/lib/utils';

const SOURCE_TYPES: VaultItemType[] = [
  'note',
  'document',
  'course_lesson',
  'flashcard',
  'practice_question_set',
  'quiz',
];

const STATUS_TABS: { label: string; value: ProjectLabIdeaStatus }[] = [
  { label: 'New', value: 'GENERATED' },
  { label: 'Saved', value: 'SAVED' },
  { label: 'Dismissed', value: 'DISMISSED' },
  { label: 'Converted', value: 'CONVERTED' },
];

export default function ProjectLabsPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [direction, setDirection] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectLabIdeaStatus>('GENERATED');
  const [dismissTarget, setDismissTarget] = useState<ProjectLabIdea | null>(null);
  const [convertTarget, setConvertTarget] = useState<ProjectLabIdea | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 50),
    queryFn: async () => {
      const res = await personalBrandingService.listProfiles(1, 50);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load brand profiles');
      }
      return res.data;
    },
  });

  const profiles = profilesQ.data?.data ?? [];

  useEffect(() => {
    if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  const ideasQ = useQuery({
    queryKey: queryKeys.knowledgeVault.projectLabIdeas.list(statusFilter),
    queryFn: () => projectLabsService.listIdeas(statusFilter, 1, 50),
  });

  const invalidateIdeas = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.knowledgeVault.projectLabIdeas.all(),
    });
  };

  const generateMutation = useMutation({
    mutationFn: () =>
      projectLabsService.generateIdeas({
        sourceItemIds: selectedIds,
        brandProfileId: selectedProfileId || null,
        direction: direction.trim() || null,
        count: 5,
      }),
    onSuccess: async () => {
      setGenerateError(null);
      setStatusFilter('GENERATED');
      await invalidateIdeas();
    },
    onError: (err: Error) => setGenerateError(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: (ideaId: string) => projectLabsService.saveIdea(ideaId),
    onSuccess: invalidateIdeas,
  });

  const dismissMutation = useMutation({
    mutationFn: ({ ideaId, feedbackText }: { ideaId: string; feedbackText: string | null }) =>
      projectLabsService.dismissIdea(ideaId, { feedbackText: feedbackText ?? undefined }),
    onSuccess: async () => {
      setDismissTarget(null);
      await invalidateIdeas();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ideaId: string) => projectLabsService.deleteIdea(ideaId),
    onSuccess: invalidateIdeas,
  });

  const canGenerate = selectedIds.length >= 1 && !generateMutation.isPending;
  const ideas = ideasQ.data?.data ?? [];

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-start gap-3">
        <FlaskConical className="w-9 h-9 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Labs</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Brainstorm project ideas from your vault learning content. Optionally align ideas with a
            brand profile for portfolio and personal-branding angles.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Generate ideas</h2>

        <MultiSelectVaultCombobox
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          minItems={1}
          maxItems={20}
          allowedTypes={SOURCE_TYPES}
          itemLabel="sources"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Brand profile <span className="font-normal text-gray-500">(optional)</span>
            </span>
            <Select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="">None — general project ideas</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              When selected, ideas include a personal-branding angle for content and portfolio
              growth.
            </p>
          </label>

          <label className="block space-y-1.5 text-sm md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Direction <span className="font-normal text-gray-500">(optional)</span>
            </span>
            <Textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              rows={3}
              placeholder="e.g. Prefer small weekend projects, or focus on open-source developer tools"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </label>
        </div>

        {generateError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
        ) : null}

        <Button
          type="button"
          disabled={!canGenerate}
          onClick={() => generateMutation.mutate()}
          className="inline-flex items-center gap-2"
        >
          {generateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generateMutation.isPending ? 'Generating…' : 'Generate project ideas'}
        </Button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
                statusFilter === tab.value
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {ideasQ.isLoading ? (
          <p className="text-sm text-gray-500">Loading ideas…</p>
        ) : ideas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-8 text-center text-sm text-gray-500">
            No {statusFilter.toLowerCase()} ideas yet. Select vault sources and generate a batch
            above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ideas.map((idea) => (
              <ProjectLabIdeaCard
                key={idea.id}
                idea={idea}
                isSaving={saveMutation.isPending && saveMutation.variables === idea.id}
                onSave={() => saveMutation.mutate(idea.id)}
                onDismiss={() => setDismissTarget(idea)}
                onConvert={() => setConvertTarget(idea)}
                onDelete={() => deleteMutation.mutate(idea.id)}
              />
            ))}
          </div>
        )}
      </section>

      <RejectIdeaModal
        isOpen={Boolean(dismissTarget)}
        ideaTitle={dismissTarget?.title}
        isSubmitting={dismissMutation.isPending}
        onClose={() => setDismissTarget(null)}
        onSubmit={(feedbackText) => {
          if (!dismissTarget) return;
          dismissMutation.mutate({ ideaId: dismissTarget.id, feedbackText });
        }}
      />

      <ConvertToProjectIdeaDialog
        isOpen={Boolean(convertTarget)}
        idea={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConverted={async () => {
          setConvertTarget(null);
          setStatusFilter('CONVERTED');
          await invalidateIdeas();
        }}
      />
    </PageContainer>
  );
}
