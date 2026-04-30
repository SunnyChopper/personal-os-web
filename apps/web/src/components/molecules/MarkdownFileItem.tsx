import { useState, useMemo } from 'react';
import { FileText, Cloud, HardDrive, AlertCircle } from 'lucide-react';
import { useNavigate, generatePath } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import type { FileTreeNode } from '@/types/markdown-files';
import { formatRelativeDate } from '@/utils/date-formatters';
import FileContextMenu from './FileContextMenu';
import { isLocalOnlyFile } from '@/hooks/useLocalFiles';
import { useMarkdownBackendStatus } from '@/hooks/useMarkdownBackendStatus';

interface MarkdownFileItemProps {
  node: FileTreeNode;
  isActive: boolean;
  level?: number;
  onSelect?: (path: string) => void;
  onEditTags?: (path: string) => void;
  onRename?: (path: string) => void;
  onDelete?: (path: string) => void;
  onOpenReaderMode?: (path: string) => void;
}

export default function MarkdownFileItem({
  node,
  isActive,
  level = 0,
  onSelect,
  onEditTags,
  onRename,
  onDelete,
  onOpenReaderMode,
}: MarkdownFileItemProps) {
  const navigate = useNavigate();
  const metadata = node.metadata;
  const { isOnline: isBackendOnline } = useMarkdownBackendStatus();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClick = () => {
    const filePath = encodeURIComponent(node.path);
    navigate(
      generatePath(ROUTES.admin.markdownViewerFile, {
        filePath,
      })
    );
    onSelect?.(node.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Context menu triggered for:', node.name, { x: e.clientX, y: e.clientY });
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get the correct file size, checking sessionStorage if metadata size is 0
  const fileSize = useMemo(() => {
    if (!metadata) return 0;

    // If metadata has a valid size, use it
    if (metadata.size && metadata.size > 0) {
      return metadata.size;
    }

    // Otherwise, check sessionStorage for uploaded file sizes
    try {
      const uploadedSizes = JSON.parse(sessionStorage.getItem('uploadedFileSizes') || '{}');
      const storedSize = uploadedSizes[node.path];
      if (storedSize && storedSize > 0) {
        return storedSize;
      }
    } catch {
      // Ignore sessionStorage errors
    }

    // Fall back to metadata size (which might be 0)
    return metadata.size || 0;
  }, [metadata, node.path]);

  // Determine file save status
  const getSaveStatus = (): 'cloud' | 'local' | 'unsaved' => {
    // Check if file is local-only (exists in localStorage with syncedToBackend === false)
    if (isLocalOnlyFile(node.path)) {
      return 'local';
    }

    // Check if file has metadata with local ID (from localStorage)
    if (metadata?.id && metadata.id.startsWith('local-')) {
      return 'local';
    }

    // If backend is offline, files cannot be synced to cloud, so show as local
    if (!isBackendOnline) {
      // If file has metadata, it exists locally (even if it was previously synced)
      if (metadata) {
        return 'local';
      }
      // No metadata means unsaved
      return 'unsaved';
    }

    // Backend is online: if file has metadata but no ID or ID doesn't start with local-, it's from backend
    if (metadata && (!metadata.id || !metadata.id.startsWith('local-'))) {
      return 'cloud';
    }

    // Default: no metadata means unsaved
    return 'unsaved';
  };

  const saveStatus = getSaveStatus();

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'cloud':
        return (
          <span title="Saved to cloud" className="flex-shrink-0">
            <Cloud
              size={14}
              className="text-green-600 dark:text-green-400"
              aria-label="Saved to cloud"
            />
          </span>
        );
      case 'local':
        return (
          <span title="Saved to local storage" className="flex-shrink-0">
            <HardDrive
              size={14}
              className="text-orange-600 dark:text-orange-400"
              aria-label="Saved to local storage"
            />
          </span>
        );
      case 'unsaved':
        return (
          <span title="Not saved" className="flex-shrink-0">
            <AlertCircle
              size={14}
              className="text-red-600 dark:text-red-400"
              aria-label="Not saved"
            />
          </span>
        );
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          isActive && 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium',
          !isActive && 'text-gray-700 dark:text-gray-300'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        aria-label={`Open file ${node.name}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <FileText size={16} className="flex-shrink-0" />
        <span className="flex-1 truncate">{node.name}</span>
        {getStatusIcon()}
        {metadata && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {metadata.tags && metadata.tags.length > 0 && (
              <span className="hidden sm:inline" title={`Tags: ${metadata.tags.join(', ')}`}>
                {metadata.tags.length} tag{metadata.tags.length !== 1 ? 's' : ''}
              </span>
            )}
            <span>{formatSize(fileSize)}</span>
            {metadata.updatedAt && (
              <span className="hidden sm:inline">{formatRelativeDate(metadata.updatedAt)}</span>
            )}
          </div>
        )}
      </button>

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenReaderMode={onOpenReaderMode ? () => onOpenReaderMode(node.path) : undefined}
          onEditTags={onEditTags ? () => onEditTags(node.path) : undefined}
          onRename={onRename ? () => onRename(node.path) : undefined}
          onDelete={onDelete ? () => onDelete(node.path) : undefined}
        />
      )}
    </>
  );
}
