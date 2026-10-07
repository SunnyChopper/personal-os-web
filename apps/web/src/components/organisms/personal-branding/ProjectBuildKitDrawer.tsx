import BottomSheet from '@/components/molecules/BottomSheet';
import { ProjectBuildKitContent } from '@/components/molecules/personal-branding/ProjectBuildKitContent';
import type { BrandProjectBuildKit } from '@/types/api/personal-branding.dto';

interface ProjectBuildKitDrawerProps {
  open: boolean;
  ideaTitle: string;
  kit: BrandProjectBuildKit | null | undefined;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
}

export default function ProjectBuildKitDrawer({
  open,
  ideaTitle,
  kit,
  isLoading,
  error,
  onClose,
}: ProjectBuildKitDrawerProps) {
  return (
    <BottomSheet isOpen={open} onClose={onClose} title={`Build kit — ${ideaTitle}`}>
      {error ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
      ) : isLoading ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Generating prompts…</p>
      ) : !kit ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Generate a build kit to get setup prompts, Cursor skills, and module prompts.
        </p>
      ) : (
        <div className="pb-6">
          <ProjectBuildKitContent kit={kit} />
        </div>
      )}
    </BottomSheet>
  );
}
