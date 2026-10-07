import { ProjectBuildKitContent } from '@/components/molecules/personal-branding/ProjectBuildKitContent';
import { gridItemCardClassName } from '@/lib/personal-branding/personal-branding-surfaces';
import { pbEyebrowClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type { BrandProjectBuildKit } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

export interface BuildIdeaKitSectionProps {
  kit: BrandProjectBuildKit;
}

export default function BuildIdeaKitSection({ kit }: BuildIdeaKitSectionProps) {
  return (
    <section
      id="build-kit"
      aria-labelledby="build-kit-heading"
      className={cn(gridItemCardClassName, 'scroll-mt-6 space-y-4 p-4 sm:p-6')}
    >
      <h3 id="build-kit-heading" className={pbEyebrowClassName}>
        Build kit
      </h3>
      <ProjectBuildKitContent kit={kit} />
    </section>
  );
}
