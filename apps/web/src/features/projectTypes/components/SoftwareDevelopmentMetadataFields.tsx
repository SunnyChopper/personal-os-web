import * as React from 'react';
import type { FC } from 'react';
import type { ProjectTypeFieldProps } from '@/features/projectTypes/registry';

export const SoftwareDevelopmentMetadataFields: FC<ProjectTypeFieldProps> = ({
  softwareMetadata,
  onSoftwareMetadataChange,
  disabled,
}) => {
  const [repoInput, setRepoInput] = React.useState('');
  const [stackInput, setStackInput] = React.useState('');

  const addRepo = () => {
    const u = repoInput.trim();
    if (!u) return;
    onSoftwareMetadataChange({
      ...softwareMetadata,
      repoUrls: [...softwareMetadata.repoUrls, u],
    });
    setRepoInput('');
  };

  const removeRepo = (idx: number) => {
    const next = [...softwareMetadata.repoUrls];
    next.splice(idx, 1);
    onSoftwareMetadataChange({ ...softwareMetadata, repoUrls: next });
  };

  const addStack = () => {
    const s = stackInput.trim();
    if (!s) return;
    onSoftwareMetadataChange({
      ...softwareMetadata,
      techStack: [...softwareMetadata.techStack, s],
    });
    setStackInput('');
  };

  const removeStack = (idx: number) => {
    const next = [...softwareMetadata.techStack];
    next.splice(idx, 1);
    onSoftwareMetadataChange({ ...softwareMetadata, techStack: next });
  };

  const updateDeployment = (idx: number, patch: Partial<{ name: string; url: string }>) => {
    const next = softwareMetadata.deployments.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    onSoftwareMetadataChange({ ...softwareMetadata, deployments: next });
  };

  const addDeployment = () => {
    onSoftwareMetadataChange({
      ...softwareMetadata,
      deployments: [...softwareMetadata.deployments, { name: '', url: '' }],
    });
  };

  const removeDeployment = (idx: number) => {
    const next = [...softwareMetadata.deployments];
    next.splice(idx, 1);
    onSoftwareMetadataChange({ ...softwareMetadata, deployments: next });
  };

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-900/30">
      <div>
        <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Repo URLs</div>
        <div className="flex gap-2">
          <input
            type="url"
            value={repoInput}
            disabled={disabled}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="https://github.com/org/repo"
            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={addRepo}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {softwareMetadata.repoUrls.map((url, idx) => (
            <li
              key={`${url}-${idx}`}
              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs shadow-sm dark:bg-gray-800"
            >
              <span className="max-w-[200px] truncate text-blue-600 dark:text-blue-400">{url}</span>
              <button
                type="button"
                disabled={disabled}
                className="text-red-500 hover:underline"
                onClick={() => removeRepo(idx)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tech stack</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={stackInput}
            disabled={disabled}
            onChange={(e) => setStackInput(e.target.value)}
            placeholder="e.g. TypeScript"
            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={addStack}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {softwareMetadata.techStack.map((tag, idx) => (
            <li
              key={`${tag}-${idx}`}
              className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100"
            >
              {tag}
              <button
                type="button"
                disabled={disabled}
                className="text-red-600 hover:underline dark:text-red-400"
                onClick={() => removeStack(idx)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deployments</span>
          <button
            type="button"
            disabled={disabled}
            onClick={addDeployment}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {softwareMetadata.deployments.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                disabled={disabled}
                value={row.name}
                onChange={(e) => updateDeployment(idx, { name: e.target.value })}
                placeholder="prod"
                className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="url"
                disabled={disabled}
                value={row.url}
                onChange={(e) => updateDeployment(idx, { url: e.target.value })}
                placeholder="https://…"
                className="min-w-[160px] flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                disabled={disabled}
                className="text-sm text-red-600 hover:underline"
                onClick={() => removeDeployment(idx)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
