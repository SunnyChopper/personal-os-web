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
}

const DEFAULT_EXT = new Set(['pdf', 'png', 'jpg', 'jpeg', 'txt', 'md', 'markdown', 'json']);

export default function FileUploadZone({
  onFilesSelected,
  accept = '.pdf,.png,.jpg,.jpeg,.txt,.md,.markdown',
  multiple = true,
  className,
  maxSizeMB = 25,
  extensions,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = filterAndValidate(Array.from(e.dataTransfer.files));
    const out = multiple ? files : files.slice(0, 1);

    if (out.length > 0) {
      setSelectedFiles(out);
      onFilesSelected(out);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = filterAndValidate(Array.from(e.target.files || []));
    const out = multiple ? files : files.slice(0, 1);

    if (out.length > 0) {
      setSelectedFiles(out);
      onFilesSelected(out);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  return (
    <div className={cn('space-y-4', className)}>
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
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected files ({selectedFiles.length}):
          </p>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
