import { PlatformRepurposerSkeleton } from '@/components/molecules/LayoutSkeletons';
import PlatformRepurposerTab from './PlatformRepurposerTab';
import { useContentPipeline } from './useContentPipeline';

export default function ContentPipelinePage() {
  const pipeline = useContentPipeline();

  return pipeline.isLoading ? (
    <PlatformRepurposerSkeleton />
  ) : (
    <PlatformRepurposerTab pipeline={pipeline} />
  );
}
