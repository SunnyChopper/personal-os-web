import type { EditorProtocol } from '@/lib/editor-links';
import { cn } from '@/lib/utils';
import { Select } from '@/components/atoms/Select';

export interface EditorLinkSettingsControlProps {
  protocol: EditorProtocol;
  localRepoRoot: string;
  onProtocolChange: (protocol: EditorProtocol) => void;
  onLocalRepoRootChange: (localRepoRoot: string) => void;
  className?: string;
}

export default function EditorLinkSettingsControl({
  protocol,
  localRepoRoot,
  onProtocolChange,
  onLocalRepoRootChange,
  className,
}: EditorLinkSettingsControlProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/50 px-3 py-2 text-xs',
        className
      )}
    >
      <label className="flex flex-col gap-1 text-gray-600 dark:text-gray-400">
        <span className="font-medium">Stack trace editor</span>
        <Select
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-gray-100 min-w-[7rem]"
          value={protocol}
          onChange={(e) => onProtocolChange(e.target.value as EditorProtocol)}
        >
          <option value="cursor">Cursor</option>
          <option value="vscode">VS Code</option>
          <option value="none">Off</option>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-gray-600 dark:text-gray-400 min-w-[12rem] flex-1 max-w-md">
        <span className="font-medium">Local repo root</span>
        <input
          type="text"
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm font-mono text-gray-900 dark:text-gray-100 w-full"
          placeholder="C:\path\to\personal-os"
          value={localRepoRoot}
          onChange={(e) => onLocalRepoRootChange(e.target.value)}
          spellCheck={false}
        />
        <span className="text-[10px] text-gray-500 dark:text-gray-500">
          Absolute path to your personal-os clone. Required to open frame paths locally.
        </span>
      </label>
    </div>
  );
}
