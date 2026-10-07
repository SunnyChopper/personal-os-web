import { Radar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentIdeaCard from '@/components/organisms/personal-branding/ContentIdeaCard';
import { TrendIdeaSourceLinks } from '@/components/molecules/personal-branding/TrendIdeaSourceLinks';
import { EmptyState } from '@/components/molecules/EmptyState';
import type { ContentIdea } from '@/types/api/personal-branding.dto';
import { ROUTES } from '@/routes';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import { pbBodySecondaryClassName, pbNestedSectionTitleClassName } from '../personal-branding-ui';

interface TrendIdeasTabProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  approvingId: string | null;
  onApprove: (idea: ContentIdea) => void;
  onReject: (idea: ContentIdea) => void;
  onOpenDraft: (idea: ContentIdea) => void;
}

export default function TrendIdeasTab({
  ideas,
  isLoading,
  approvingId,
  onApprove,
  onReject,
  onOpenDraft,
}: TrendIdeasTabProps) {
  const navigate = useNavigate();

  const openTrendStream = () => {
    navigate(`${ROUTES.admin.personalBrandingRadar}?tab=trends`);
  };

  return (
    <div className="space-y-6">
      <PageCard className="space-y-3">
        <SectionIntro
          title="Trend Ideas"
          description="Review AI content ideas grounded in Trend Stream signals. Approve to generate a Sandbox draft, or reject with feedback to improve future brainstorms. Ideas stay visible after you generate a draft so you can reference them or create more content."
        />
        <p className={pbBodySecondaryClassName}>
          To generate new ideas, select up to 10 cards on Signal Radar → Trend Stream and choose{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Brainstorm content ideas
          </span>
          .
        </p>
      </PageCard>

      <section className="space-y-4">
        <h3 className={pbNestedSectionTitleClassName}>Trend-sourced content ideas</h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading ideas…</p>
        ) : ideas.length === 0 ? (
          <EmptyState
            icon={Radar}
            density="compact"
            title="No Trend Stream ideas yet"
            description="Select cards in Signal Radar and brainstorm content ideas."
            actionLabel="Open Signal Radar → Trend Stream"
            onAction={openTrendStream}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <ContentIdeaCard
                key={idea.id}
                idea={idea}
                isApproving={approvingId === idea.id}
                onApprove={onApprove}
                onReject={onReject}
                onOpenDraft={onOpenDraft}
                metaExtras={
                  (idea.radarItemSnapshots ?? []).length > 0 ? (
                    <TrendIdeaSourceLinks snapshots={idea.radarItemSnapshots ?? []} />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
