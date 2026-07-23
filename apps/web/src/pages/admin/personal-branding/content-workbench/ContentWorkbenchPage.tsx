import { useState } from 'react';
import SubModuleTabShell from '../SubModuleTabShell';
import ApproveIdeaGenerateModal from './ApproveIdeaGenerateModal';
import ContentTemplateFormModal from './ContentTemplateFormModal';
import ContentTemplatesTab from './ContentTemplatesTab';
import IdeationEngineTab from './IdeationEngineTab';
import NewDraftWizardModal from './NewDraftWizardModal';
import RejectIdeaModal from './RejectIdeaModal';
import RetryTemplateModal from './RetryTemplateModal';
import SandboxWorkspaceTab from './SandboxWorkspaceTab';
import TitlePromptModal from './TitlePromptModal';
import VaultExtractorTab from './VaultExtractorTab';
import TrendIdeasTab from './TrendIdeasTab';
import { useContentTemplates } from './useContentTemplates';
import { useContentWorkbench } from './useContentWorkbench';

const TABS = [
  { id: 'sandbox', label: 'Sandbox Workspace' },
  { id: 'ideation', label: 'Ideation Engine' },
  { id: 'vault-extractor', label: 'Vault Extractor' },
  { id: 'trend-ideas', label: 'Trend Ideas' },
  { id: 'content-templates', label: 'Content Templates' },
] as const;

export default function ContentWorkbenchPage() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const wb = useContentWorkbench();
  const ct = useContentTemplates();

  const isLoading =
    wb.contentQ.isPending ||
    wb.ideasQ.isPending ||
    (wb.activeTab === 'content-templates' && (ct.templatesQ.isPending || ct.candidatesQ.isPending));

  return (
    <>
      <SubModuleTabShell
        tabs={TABS}
        defaultTabId="sandbox"
        activeTabId={wb.activeTab}
        onTabChange={wb.setActiveTab}
        ariaLabel="Content Workbench sections"
        isLoading={isLoading}
        skeletonLayout="two-column"
        layout="fill"
        panelOverflow={wb.activeTab === 'sandbox' ? 'hidden' : 'auto'}
        renderPanel={(activeTab) => {
          if (activeTab === 'ideation') {
            return (
              <IdeationEngineTab
                ideas={wb.ideationIdeas}
                isLoading={wb.ideasQ.isPending}
                approvingId={
                  wb.approveIdeaMutation.isPending
                    ? (wb.approveIdeaMutation.variables?.ideaId ?? null)
                    : null
                }
                profiles={wb.brandProfiles}
                profilesLoading={wb.profilesQ.isPending}
                selectedProfileId={wb.selectedProfileId}
                onProfileChange={wb.setSelectedProfileId}
                targetPlatform={wb.targetPlatform}
                onTargetPlatformChange={wb.setTargetPlatform}
                seedIdeas={wb.seedIdeas}
                onSeedIdeasChange={wb.setSeedIdeas}
                enableImageSearch={wb.enableImageSearch}
                onEnableImageSearchChange={wb.setEnableImageSearch}
                ideaCount={wb.ideaCount}
                onIdeaCountChange={wb.setIdeaCount}
                ideationModelCatalog={wb.ideationModelCatalog}
                isIdeationModelCatalogLoading={wb.isIdeationModelCatalogLoading}
                ideationModelPicker={wb.ideationModelPicker}
                onIdeationModelPickerChange={wb.setIdeationModelPicker}
                isGenerating={wb.isGeneratingIdeas}
                ideationJob={wb.ideationJob}
                generateError={wb.generateError}
                lastGenerationStats={wb.lastGenerationStats}
                onGenerate={() => wb.generateIdeasMutation.mutate()}
                onApprove={(idea) => wb.setApprovingIdea(idea)}
                onReject={(idea) => wb.setRejectingIdea(idea)}
              />
            );
          }

          if (activeTab === 'vault-extractor') {
            return (
              <VaultExtractorTab
                ideas={wb.vaultIdeas}
                isLoading={wb.ideasQ.isPending}
                approvingId={
                  wb.approveIdeaMutation.isPending
                    ? (wb.approveIdeaMutation.variables?.ideaId ?? null)
                    : null
                }
                profiles={wb.brandProfiles}
                profilesLoading={wb.profilesQ.isPending}
                selectedProfileId={wb.selectedProfileId}
                onProfileChange={wb.setSelectedProfileId}
                targetPlatform={wb.targetPlatform}
                onTargetPlatformChange={wb.setTargetPlatform}
                selectedVaultItemIds={wb.selectedVaultItemIds}
                onVaultSelectionChange={wb.setSelectedVaultItemIds}
                vaultItemLabels={wb.vaultItemLabels}
                onVaultItemLabelsChange={wb.setVaultItemLabels}
                isGenerating={wb.isGeneratingVaultIdeas}
                vaultJob={wb.vaultJob}
                generateError={wb.vaultGenerateError}
                lastGenerationStats={wb.lastVaultGenerationStats}
                onGenerate={() => wb.generateVaultIdeasMutation.mutate()}
                onApprove={(idea) => wb.setApprovingIdea(idea)}
                onReject={(idea) => wb.setRejectingIdea(idea)}
              />
            );
          }

          if (activeTab === 'trend-ideas') {
            return (
              <TrendIdeasTab
                ideas={wb.trendIdeas}
                isLoading={wb.ideasQ.isPending}
                approvingId={
                  wb.approveIdeaMutation.isPending
                    ? (wb.approveIdeaMutation.variables?.ideaId ?? null)
                    : null
                }
                onApprove={(idea) => wb.setApprovingIdea(idea)}
                onReject={(idea) => wb.setRejectingIdea(idea)}
              />
            );
          }

          if (activeTab === 'content-templates') {
            return (
              <ContentTemplatesTab
                templates={ct.templates}
                candidates={ct.candidates}
                templatesLoading={ct.templatesQ.isPending}
                candidatesLoading={ct.candidatesQ.isPending}
                profiles={wb.brandProfiles}
                profilesLoading={wb.profilesQ.isPending}
                selectedProfileId={wb.selectedProfileId}
                onProfileChange={wb.setSelectedProfileId}
                brainstormBrief={ct.brainstormBrief}
                onBrainstormBriefChange={ct.setBrainstormBrief}
                brainstormContentType={ct.brainstormContentType}
                onBrainstormContentTypeChange={ct.setBrainstormContentType}
                brainstormPlatform={ct.brainstormPlatform}
                onBrainstormPlatformChange={ct.setBrainstormPlatform}
                isBrainstorming={ct.isBrainstorming}
                brainstormProgressMessage={ct.brainstormProgressMessage}
                brainstormError={ct.brainstormError}
                lastBrainstormStats={ct.lastBrainstormStats}
                onBrainstorm={() => {
                  if (!wb.selectedProfileId) return;
                  ct.brainstormMutation.mutate(wb.selectedProfileId);
                }}
                sourceKind={ct.sourceKind}
                onSourceKindChange={ct.setSourceKind}
                sourceUrl={ct.sourceUrl}
                onSourceUrlChange={ct.setSourceUrl}
                hasMediumApiKey={ct.settingsQ.data?.hasMediumApiKey ?? false}
                isExtracting={ct.isExtracting}
                extractProgressMessage={ct.extractProgressMessage}
                extractError={ct.extractError}
                lastExtractionStats={ct.lastExtractionStats}
                onExtract={() => ct.extractMutation.mutate()}
                approvingId={
                  ct.approveCandidateMutation.isPending
                    ? (ct.approveCandidateMutation.variables?.candidateId ?? null)
                    : null
                }
                retryingId={ct.isRetrying ? (ct.retryingCandidate?.id ?? null) : null}
                onCreateTemplate={() => {
                  ct.setEditingTemplate(null);
                  ct.setTemplateFormOpen(true);
                }}
                onEditTemplate={(template) => {
                  ct.setEditingTemplate(template);
                  ct.setTemplateFormOpen(true);
                }}
                onDeleteTemplate={(templateId) => {
                  if (window.confirm('Delete this content template?')) {
                    ct.deleteTemplateMutation.mutate(templateId);
                  }
                }}
                onApprove={(candidateId) => ct.approveCandidateMutation.mutate({ candidateId })}
                onReject={(candidate) => ct.setRejectingCandidate(candidate)}
                onRetry={(candidate) => ct.setRetryingCandidate(candidate)}
              />
            );
          }

          return (
            <SandboxWorkspaceTab
              contentNodes={wb.contentNodes}
              activeDraftId={wb.activeDraftId}
              activeContentStatus={wb.activeContentStatus}
              editorTitle={wb.editorTitle}
              onTitleChange={(v) => {
                wb.setEditorTitle(v);
              }}
              editorBody={wb.editorBody}
              onBodyChange={wb.handleEditorBodyChange}
              contentType={wb.contentType}
              draftPlatform={wb.draftPlatform}
              onDraftPlatformChange={wb.setDraftPlatform}
              draftCanonicalUrl={wb.draftCanonicalUrl}
              onDraftCanonicalUrlChange={wb.setDraftCanonicalUrl}
              draftPillars={wb.draftPillars}
              onDraftPillarsChange={wb.setDraftPillars}
              brandPillarOptions={wb.brandPillarOptions}
              assetPrompts={wb.assetPrompts}
              isDirty={wb.isDirty}
              isSaving={wb.saveDraftMutation.isPending}
              isPublishing={wb.publishMutation.isPending}
              isUnpublishing={wb.unpublishMutation.isPending}
              isDeleting={wb.deleteDraftMutation.isPending}
              isGeneratingAssets={wb.assetPromptsMutation.isPending}
              isInjectingImages={wb.isInjectingImages}
              imageInjectError={wb.imageInjectError}
              imageInjectMessage={wb.imageInjectJob?.message ?? null}
              drawerOpen={drawerOpen}
              onToggleDrawer={() => setDrawerOpen((v) => !v)}
              onLoadDraft={wb.loadDraft}
              onNewDraft={wb.openNewDraftWizard}
              onSaveDraft={wb.requestSaveDraft}
              onDeleteDraft={async () => {
                if (!wb.activeDraftId) return;
                await wb.deleteDraftMutation.mutateAsync(wb.activeDraftId);
              }}
              onPublish={async (metadata) => {
                await wb.publishMutation.mutateAsync(metadata);
              }}
              onUnpublish={async () => {
                await wb.unpublishMutation.mutateAsync();
              }}
              onGenerateAssetPrompts={() => wb.assetPromptsMutation.mutate()}
              onInjectImages={() =>
                wb.injectImagesMutation.mutate({
                  title: wb.editorTitle.trim() || 'Untitled draft',
                  body: wb.editorBody,
                  contentId: wb.activeDraftId ?? undefined,
                  contentType: wb.contentType,
                })
              }
              isOptimizingKeywords={wb.isOptimizingKeywords}
              keywordOptimizeError={wb.keywordOptimizeError}
              onOptimizeKeywords={wb.onOptimizeKeywords}
            />
          );
        }}
      />

      <ApproveIdeaGenerateModal
        idea={wb.approvingIdea}
        defaultBrandProfileId={wb.selectedProfileId}
        profiles={wb.brandProfiles}
        profilesLoading={wb.profilesQ.isPending}
        isSubmitting={wb.approveIdeaMutation.isPending}
        errorMessage={wb.approveError}
        onClose={() => {
          if (wb.approveIdeaMutation.isPending) return;
          wb.setApprovingIdea(null);
          wb.setApproveError(null);
        }}
        onSubmit={(request) => wb.approveIdeaMutation.mutate(request)}
      />

      <NewDraftWizardModal
        isOpen={wb.newDraftWizardOpen}
        isGenerating={wb.generateDraftMutation.isPending}
        onClose={wb.closeNewDraftWizard}
        onStartFromTemplate={wb.startFromTemplate}
        onGenerateWithAi={(request) => wb.generateDraftMutation.mutate(request)}
      />

      <TitlePromptModal
        isOpen={wb.titlePromptOpen}
        isSaving={wb.saveDraftMutation.isPending}
        onClose={() => wb.setTitlePromptOpen(false)}
        onSaveWithTitle={wb.saveWithResolvedTitle}
        onKeepUntitled={wb.keepUntitledAndSave}
      />

      <RejectIdeaModal
        isOpen={Boolean(wb.rejectingIdea)}
        ideaTitle={wb.rejectingIdea?.title}
        isSubmitting={wb.rejectIdeaMutation.isPending}
        onClose={() => wb.setRejectingIdea(null)}
        onSubmit={(feedbackText) => {
          if (!wb.rejectingIdea) return;
          wb.rejectIdeaMutation.mutate({ ideaId: wb.rejectingIdea.id, feedbackText });
        }}
      />

      <ContentTemplateFormModal
        isOpen={ct.templateFormOpen}
        template={ct.editingTemplate}
        isSubmitting={ct.createTemplateMutation.isPending || ct.updateTemplateMutation.isPending}
        onClose={() => {
          ct.setTemplateFormOpen(false);
          ct.setEditingTemplate(null);
        }}
        onSubmit={(body) => {
          if (ct.editingTemplate) {
            ct.updateTemplateMutation.mutate({ id: ct.editingTemplate.id, body });
            return;
          }
          ct.createTemplateMutation.mutate(body);
        }}
      />

      <RejectIdeaModal
        isOpen={Boolean(ct.rejectingCandidate)}
        ideaTitle={ct.rejectingCandidate?.title}
        isSubmitting={ct.rejectCandidateMutation.isPending}
        onClose={() => ct.setRejectingCandidate(null)}
        onSubmit={(feedbackText) => {
          if (!ct.rejectingCandidate) return;
          ct.rejectCandidateMutation.mutate({
            candidateId: ct.rejectingCandidate.id,
            feedbackText,
          });
        }}
      />

      <RetryTemplateModal
        isOpen={Boolean(ct.retryingCandidate)}
        candidateTitle={ct.retryingCandidate?.title}
        isSubmitting={ct.isRetrying}
        progressMessage={ct.retryProgressMessage}
        errorMessage={ct.retryError}
        onClose={() => ct.setRetryingCandidate(null)}
        onSubmit={(feedbackText) => {
          if (!ct.retryingCandidate) return;
          ct.retryCandidateMutation.mutate({
            candidateId: ct.retryingCandidate.id,
            feedbackText,
          });
        }}
      />
    </>
  );
}
