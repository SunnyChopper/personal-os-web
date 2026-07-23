import SubModuleTabShell from '../SubModuleTabShell';
import PlatformRepurposerTab from './PlatformRepurposerTab';
import PublishQueueTab from './PublishQueueTab';
import { useContentPipeline } from './useContentPipeline';
import { useContentPipelineTabs } from './useContentPipelineTabs';

const TABS = [
  { id: 'repurposer', label: 'Repurposer' },
  { id: 'publish-queue', label: 'Publish Queue' },
] as const;

export default function ContentPipelinePage() {
  const tabs = useContentPipelineTabs();
  const pipeline = useContentPipeline();

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="repurposer"
      activeTabId={tabs.activeTab}
      onTabChange={tabs.setActiveTab}
      ariaLabel="Content Pipeline sections"
      isLoading={tabs.activeTab === 'repurposer' && pipeline.isLoading}
      skeletonLayout="platform-repurposer"
      renderPanel={(activeTab) =>
        activeTab === 'publish-queue' ? (
          <PublishQueueTab />
        ) : (
          <PlatformRepurposerTab pipeline={pipeline} />
        )
      }
    />
  );
}
