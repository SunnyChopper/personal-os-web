import type { FC } from 'react';
import type { Project } from '@/types/growth-system';

export const SoftwareDevelopmentDetailSections: FC<{ project: Project }> = ({ project }) => {
  const meta = project.softwareMetadata;
  if (!meta) return null;

  const hasDeployments = meta.deployments.some((d) => Boolean(d.name && d.url));

  return (
    <div className="space-y-4">
      {meta.repoUrls.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Repositories
          </h3>
          <ul className="space-y-1">
            {meta.repoUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasDeployments && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Deployments</h3>
          <ul className="space-y-1">
            {meta.deployments
              .filter((d) => d.name && d.url)
              .map((d) => (
                <li key={`${d.name}-${d.url}`}>
                  <span className="text-gray-600 dark:text-gray-400">{d.name}: </span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {d.url}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
      {meta.techStack.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tech stack</h3>
          <div className="flex flex-wrap gap-2">
            {meta.techStack.map((t) => (
              <span
                key={t}
                className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
