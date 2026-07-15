import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  /** Max size per file in MB (default 25) */
  maxSizeMB?: number;
  /** If set, only these extensions (lowercase, no dot) are accepted; overrides default allowlist */
  extensions?: string[];
  /** When true, newly selected files append to the current list (deduped by name+size). */
  append?: boolean;
}

const DEFAULT_EXT = new Set(['pdf', 'png', 'jpg', 'jpeg', 'txt', 'md', 'markdown', 'json']);
const COLLAPSED_FILE_PREVIEW_COUNT = 3;

export default function FileUploadZone({
  onFilesSelected,
  accept = '.pdf,.png,.jpg,.jpeg,.txt,.md,.markdown',
  multiple = true,
  className,
  maxSizeMB = 25,
  extensions,
  append = false,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const filterAndValidate = (incoming: File[]): File[] => {
    setSizeError(null);
    const allowedExt = extensions?.length
      ? new Set(extensions.map((e) => e.toLowerCase().replace(/^\./, '')))
      : DEFAULT_EXT;
    const ok: File[] = [];
    for (const file of incoming) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExt.has(extension)) continue;
      if (file.size > maxBytes) {
        setSizeError(`"${file.name}" exceeds ${maxSizeMB} MB`);
        continue;
      }
      ok.push(file);
    }
    return ok;
  };

  const mergeFiles = (incoming: File[]): File[] => {
    if (!append) return incoming;
    const seen = new Set(selectedFiles.map((f) => `${f.name}:${f.size}`));
    const merged = [...selectedFiles];
    for (const file of incoming) {
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(file);
    }
    return merged;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = filterAndValidate(Array.from(e.dataTransfer.files));
    const out = multiple ? files : files.slice(0, 1);
    const merged = mergeFiles(out);

    if (merged.length > 0) {
      setSelectedFiles(merged);
      setIsExpanded(false);
      onFilesSelected(merged);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = filterAndValidate(Array.from(e.target.files || []));
    const out = multiple ? files : files.slice(0, 1);
    const merged = mergeFiles(out);

    if (merged.length > 0) {
      setSelectedFiles(merged);
      setIsExpanded(false);
      onFilesSelected(merged);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
    if (newFiles.length <= COLLAPSED_FILE_PREVIEW_COUNT) {
      setIsExpanded(false);
    }
  };

  const hasCollapsibleList = selectedFiles.length > COLLAPSED_FILE_PREVIEW_COUNT;
  const hiddenFileCount = selectedFiles.length - COLLAPSED_FILE_PREVIEW_COUNT;
  const visibleFiles =
    hasCollapsibleList && !isExpanded
      ? selectedFiles.slice(0, COLLAPSED_FILE_PREVIEW_COUNT)
      : selectedFiles;

  const renderFileRow = (file: File, index: number) => (
    <div
      key={`${file.name}-${index}`}
      className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
    >
      <File size={16} className="flex-shrink-0 text-gray-400" />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
        {file.name}
      </span>
      <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
        ({(file.size / 1024).toFixed(1)} KB)
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          removeFile(index);
        }}
        className="flex-shrink-0 rounded p-1 transition hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={`Remove ${file.name}`}
      >
        <X size={14} className="text-gray-500" />
      </button>
    </div>
  );

  return (
    <div className={cn('min-w-0 space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          Drag files here or <span className="text-blue-600 dark:text-blue-400">browse</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          PDF, images, text, Markdown — max {maxSizeMB} MB each
        </p>
        {sizeError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">{sizeError}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected files ({selectedFiles.length}):
            </p>
            {hasCollapsibleList && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
                className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {isExpanded ? 'Collapse list' : 'Expand list'}
              </button>
            )}
          </div>
          <div
            className={cn(
              'min-w-0 space-y-1',
              hasCollapsibleList && isExpanded && 'max-h-48 overflow-y-auto pr-1'
            )}
          >
            {visibleFiles.map((file, index) => renderFileRow(file, index))}
          </div>
          {hasCollapsibleList && !isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800/50"
            >
              Show {hiddenFileCount} more file{hiddenFileCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
