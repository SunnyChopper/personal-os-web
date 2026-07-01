import { useState } from 'react';
import SubModuleTabShell from '../SubModuleTabShell';
import IdeationEngineTab from './IdeationEngineTab';
import NewDraftWizardModal from './NewDraftWizardModal';
import RejectIdeaModal from './RejectIdeaModal';
import SandboxWorkspaceTab from './SandboxWorkspaceTab';
import TitlePromptModal from './TitlePromptModal';
import { useContentWorkbench } from './useContentWorkbench';

const TABS = [
  { id: 'sandbox', label: 'Sandbox Workspace' },
  { id: 'ideation', label: 'Ideation Engine' },
] as const;

export default function ContentWorkbenchPage() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const wb = useContentWorkbench();

  const isLoading = wb.contentQ.isPending || wb.ideasQ.isPending;

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
        renderPanel={(activeTab) =>
          activeTab === 'ideation' ? (
            <IdeationEngineTab
              ideas={wb.ideas}
              isLoading={wb.ideasQ.isPending}
              approvingId={
                wb.approveIdeaMutation.isPending ? (wb.approveIdeaMutation.variables ?? null) : null
              }
              profiles={wb.brandProfiles}
              profilesLoading={wb.profilesQ.isPending}
              selectedProfileId={wb.selectedProfileId}
              onProfileChange={wb.setSelectedProfileId}
              targetPlatform={wb.targetPlatform}
              onTargetPlatformChange={wb.setTargetPlatform}
              seedIdeas={wb.seedIdeas}
              onSeedIdeasChange={wb.setSeedIdeas}
              isGenerating={wb.generateIdeasMutation.isPending}
              generateError={wb.generateError}
              onGenerate={() => wb.generateIdeasMutation.mutate()}
              onApprove={(ideaId) => wb.approveIdeaMutation.mutate(ideaId)}
              onReject={(idea) => wb.setRejectingIdea(idea)}
            />
          ) : (
            <SandboxWorkspaceTab
              draftNodes={wb.draftNodes}
              activeDraftId={wb.activeDraftId}
              editorTitle={wb.editorTitle}
              onTitleChange={(v) => {
                wb.setEditorTitle(v);
              }}
              editorBody={wb.editorBody}
              onBodyChange={wb.handleEditorBodyChange}
              contentType={wb.contentType}
              assetPrompts={wb.assetPrompts}
              isDirty={wb.isDirty}
              isSaving={wb.saveDraftMutation.isPending}
              isPublishing={wb.publishMutation.isPending}
              isDeleting={wb.deleteDraftMutation.isPending}
              isGeneratingAssets={wb.assetPromptsMutation.isPending}
              drawerOpen={drawerOpen}
              onToggleDrawer={() => setDrawerOpen((v) => !v)}
              onLoadDraft={wb.loadDraft}
              onNewDraft={wb.openNewDraftWizard}
              onSaveDraft={wb.requestSaveDraft}
              onDeleteDraft={async () => {
                if (!wb.activeDraftId) return;
                await wb.deleteDraftMutation.mutateAsync(wb.activeDraftId);
              }}
              onPublish={() => wb.publishMutation.mutate()}
              onGenerateAssetPrompts={() => wb.assetPromptsMutation.mutate()}
            />
          )
        }
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
    </>
  );
}
