import type { FC } from 'react';
import type { Project } from '@/types/growth-system';

function firstRepoHost(project: Project): string {
  const urls = project.softwareMetadata?.repoUrls ?? [];
  const u = urls[0];
  if (!u) return '';
  try {
    return new URL(u).hostname;
  } catch {
    return '';
  }
}

export const SoftwareDevelopmentCardBadges: FC<{ project: Project }> = ({ project }) => {
  const host = firstRepoHost(project);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
        Dev
      </span>
      {host ? (
        <span className="truncate text-[10px] text-gray-500 dark:text-gray-400" title={host}>
          {host}
        </span>
      ) : null}
    </span>
  );
};
