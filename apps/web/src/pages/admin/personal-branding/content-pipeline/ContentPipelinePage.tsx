import SubModuleTabShell from '../SubModuleTabShell';
import PipelineLogbookTab from './PipelineLogbookTab';
import PlatformRepurposerTab from './PlatformRepurposerTab';
import { useContentPipeline } from './useContentPipeline';

const TABS = [
  { id: 'repurposer', label: 'Platform Repurposer' },
  { id: 'logbook', label: 'Pipeline Logbook' },
] as const;

export default function ContentPipelinePage() {
  const pipeline = useContentPipeline();

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId="repurposer"
      ariaLabel="Content Pipeline sections"
      isLoading={pipeline.isLoading}
      skeletonLayout="platform-repurposer"
      renderPanel={(activeTab) =>
        activeTab === 'logbook' ? (
          <PipelineLogbookTab />
        ) : (
          <PlatformRepurposerTab pipeline={pipeline} />
        )
      }
    />
  );
}
