import { useRef, useMemo, useState, useEffect } from 'react';
import {
  Loader,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  List,
  Tag,
  FolderKanban,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useFileTree } from '@/hooks/useFileTree';
import { useParams } from 'react-router-dom';
import MarkdownFileItem from '@/components/molecules/MarkdownFileItem';
import MarkdownFileSearch from './MarkdownFileSearch';
import NewFileDropdown from '@/components/molecules/NewFileDropdown';
import TagCategoryView from './TagCategoryView';
import RecentFilesList from '@/components/molecules/RecentFilesList';
import { getAllLocalFiles } from '@/hooks/useLocalFiles';
import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/types/markdown-files';

type ViewMode = 'tree' | 'tags' | 'categories';

interface MarkdownFileTreeProps {
  onFileSelect?: (path: string) => void;
  onNewFile?: () => void;
  onNewUpload?: () => void;
  onNewFolder?: () => void;
  onEditTags?: (path: string) => void;
  onRename?: (path: string) => void;
  onDelete?: (path: string) => void;
  onOpenReaderMode?: (path: string) => void;
}

// Flatten tree structure for virtualization while preserving hierarchy
interface FlattenedNode {
  node: FileTreeNode;
  level: number;
  index: number;
  isVisible: boolean;
}

function flattenTree(
  nodes: FileTreeNode[],
  expandedPaths: Set<string>,
  level = 0
): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  let index = 0;

  const traverse = (items: FileTreeNode[], currentLevel: number) => {
    for (const node of items) {
      result.push({
        node,
        level: currentLevel,
        index: index++,
        isVisible: true,
      });

      // If it's a folder and expanded, traverse children
      if (node.type === 'folder' && node.children && expandedPaths.has(node.path)) {
        traverse(node.children, currentLevel + 1);
      }
    }
  };

  traverse(nodes, level);
  return result;
}

// "use no memo" - React Compiler: @tanstack/react-virtual is incompatible with memoization
export default function MarkdownFileTree({
  onFileSelect,
  onNewFile,
  onNewUpload,
  onNewFolder,
  onEditTags,
  onRename,
  onDelete,
  onOpenReaderMode,
}: MarkdownFileTreeProps) {
  const { tree, isLoading, isError, error } = useFileTree();
  const params = useParams<{ filePath?: string }>();
  const activeFilePath = params.filePath ? decodeURIComponent(params.filePath) : undefined;
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [localStorageVersion, setLocalStorageVersion] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const parentRef = useRef<HTMLDivElement>(null);

  // Merge backend tree with local files from localStorage
  const mergedTree = useMemo(() => {
    const backendTree = tree || [];
    const localFiles = getAllLocalFiles();

    // Get all file paths from backend tree to avoid duplicates
    const backendFilePaths = new Set<string>();
    const collectPaths = (nodes: FileTreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          backendFilePaths.add(node.path);
        }
        if (node.children) {
          collectPaths(node.children);
        }
      }
    };
    collectPaths(backendTree);

    // Convert local files to FileTreeNode format
    // Only include files that are:
    // 1. NOT in the backend tree (to avoid duplicates)
    // 2. NOT synced to backend (syncedToBackend === false)
    const localNodes: FileTreeNode[] = localFiles
      .filter((local) => !backendFilePaths.has(local.path) && !local.syncedToBackend)
      .map((local) => ({
        type: 'file' as const,
        name: local.path.split('/').pop() || local.path,
        path: local.path,
        metadata: {
          id: `local-${local.path}`,
          path: local.path,
          name: local.path.split('/').pop() || local.path,
          content: local.content,
          size: new Blob([local.content]).size,
          tags: local.tags,
          category: local.category,
          createdAt: local.createdAt,
          updatedAt: local.updatedAt,
        },
      }));

    // Combine backend tree with local files
    return [...backendTree, ...localNodes];
  }, [tree, localStorageVersion]);

  // Listen for localStorage changes to refresh local files
  useEffect(() => {
    const handleStorageChange = () => {
      setLocalStorageVersion((prev) => prev + 1);
    };

    const handleLocalStorageFilesChanged = () => {
      // Immediately refresh when files are saved to localStorage
      setLocalStorageVersion((prev) => prev + 1);
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom event when files are saved to localStorage in this tab
    window.addEventListener('localStorageFilesChanged', handleLocalStorageFilesChanged);

    // Also poll for changes (since same-tab changes don't trigger storage event)
    // Use a shorter interval to catch changes faster
    const interval = setInterval(() => {
      setLocalStorageVersion((prev) => prev + 1);
    }, 500); // Check every 500ms for faster updates

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageFilesChanged', handleLocalStorageFilesChanged);
      clearInterval(interval);
    };
  }, []);

  // Initialize expanded paths with root level folders
  useEffect(() => {
    if (mergedTree && mergedTree.length > 0) {
      const rootFolders = mergedTree
        .filter((node) => node.type === 'folder')
        .map((node) => node.path);
      setExpandedPaths((prev) => {
        // Only update if there are new folders to add
        const hasNewFolders = rootFolders.some((path) => !prev.has(path));
        if (!hasNewFolders) return prev;
        const newSet = new Set(prev);
        rootFolders.forEach((path) => newSet.add(path));
        return newSet;
      });
    }
  }, [mergedTree]);

  // Flatten tree for virtualization
  const flattenedNodes = useMemo(() => {
    if (!mergedTree || mergedTree.length === 0) return [];
    return flattenTree(mergedTree, expandedPaths);
  }, [mergedTree, expandedPaths]);

  // Virtualization setup
  // Note: React Compiler will show a warning here about @tanstack/react-virtual being incompatible
  // with memoization. This is expected and safe to ignore - the virtualizer works correctly.
  // The warning occurs because the library returns functions that can't be memoized, but this
  // doesn't affect functionality. React Compiler will skip memoization for this component.
  const virtualizer = useVirtualizer({
    count: flattenedNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated height per item
    overscan: 5, // Render 5 extra items outside viewport
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400">
        {error?.message || 'Failed to load file tree'}
      </div>
    );
  }

  const handleToggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  if (!mergedTree || mergedTree.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Search and Actions Header */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <MarkdownFileSearch />
          <div className="mt-2">
            <NewFileDropdown
              onNewFile={onNewFile || (() => {})}
              onNewUpload={onNewUpload || (() => {})}
              onNewFolder={onNewFolder || (() => {})}
            />
          </div>
        </div>
        {/* Centered empty state */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No files yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      {/* View Mode Toggle */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition',
              viewMode === 'tree'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
            title="Tree view"
          >
            <List size={14} />
            <span className="hidden sm:inline">Tree</span>
          </button>
          <button
            onClick={() => setViewMode('tags')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition',
              viewMode === 'tags'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
            title="Tags view"
          >
            <Tag size={14} />
            <span className="hidden sm:inline">Tags</span>
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition',
              viewMode === 'categories'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
            title="Categories view"
          >
            <FolderKanban size={14} />
            <span className="hidden sm:inline">Categories</span>
          </button>
        </div>
      </div>

      {/* Recent Files (only in tree view) */}
      {viewMode === 'tree' && <RecentFilesList onFileSelect={onFileSelect} maxItems={10} />}

      {/* Search and Actions Header */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <MarkdownFileSearch />
        <div className="mt-2">
          <NewFileDropdown
            onNewFile={onNewFile || (() => {})}
            onNewUpload={onNewUpload || (() => {})}
            onNewFolder={onNewFolder || (() => {})}
          />
        </div>
      </div>

      {/* Content Area - Tree View */}
      {viewMode === 'tree' && (
        <div ref={parentRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const flattenedNode = flattenedNodes[virtualItem.index];
              if (!flattenedNode) return null;

              const { node, level } = flattenedNode;
              const isExpanded = expandedPaths.has(node.path);

              if (node.type === 'folder') {
                return (
                  <div
                    key={virtualItem.key}
                    className="absolute top-0 left-0 w-full"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <div className="px-2">
                      <button
                        onClick={() => handleToggleFolder(node.path)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                          'text-gray-700 dark:text-gray-300'
                        )}
                        style={{ paddingLeft: `${12 + level * 16}px` }}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} folder ${node.name}`}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="flex-shrink-0" />
                        )}
                        {isExpanded ? (
                          <FolderOpen size={16} className="flex-shrink-0 text-blue-500" />
                        ) : (
                          <Folder size={16} className="flex-shrink-0 text-blue-500" />
                        )}
                        <span className="flex-1 truncate font-medium">{node.name}</span>
                        {node.children && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {node.children.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={virtualItem.key}
                    className="absolute top-0 left-0 w-full"
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <div className="px-2">
                      <MarkdownFileItem
                        node={node}
                        isActive={node.path === activeFilePath}
                        level={level}
                        onSelect={onFileSelect}
                        onEditTags={onEditTags}
                        onRename={onRename}
                        onDelete={onDelete}
                        onOpenReaderMode={onOpenReaderMode}
                      />
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Content Area - Tag/Category View */}
      {viewMode !== 'tree' && (
        <div className="flex-1 overflow-y-auto">
          <TagCategoryView viewMode={viewMode} onFileSelect={onFileSelect} />
        </div>
      )}
    </div>
  );
}
