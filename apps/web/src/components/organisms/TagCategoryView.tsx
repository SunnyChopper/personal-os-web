import { useMemo, useState } from 'react';
import { Tag, FolderOpen, FileText } from 'lucide-react';
import { useNavigate, generatePath } from 'react-router-dom';
import { useMarkdownFiles } from '@/hooks/useMarkdownFiles';
import { markdownFilesService } from '@/services/markdown-files.service';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import type { MarkdownFile } from '@/types/markdown-files';

interface TagCategoryViewProps {
  viewMode: 'tags' | 'categories';
  onFileSelect?: (path: string) => void;
}

export default function TagCategoryView({ viewMode, onFileSelect }: TagCategoryViewProps) {
  const navigate = useNavigate();
  const { files, isLoading } = useMarkdownFiles();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Fetch tags or categories
  const { data: tagsData } = useQuery({
    queryKey: ['markdown-tags'],
    queryFn: () => markdownFilesService.getTags(),
    enabled: viewMode === 'tags',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['markdown-categories'],
    queryFn: () => markdownFilesService.getCategories(),
    enabled: viewMode === 'categories',
  });

  const availableItems = viewMode === 'tags' ? tagsData?.data || [] : categoriesData?.data || [];

  // Group files by tag or category
  const groupedFiles = useMemo(() => {
    const groups: Record<string, MarkdownFile[]> = {};

    files.forEach((file) => {
      if (viewMode === 'tags') {
        if (file.tags && file.tags.length > 0) {
          file.tags.forEach((tag) => {
            if (!groups[tag]) {
              groups[tag] = [];
            }
            groups[tag].push(file);
          });
        } else {
          // Files without tags go to "Untagged"
          if (!groups['Untagged']) {
            groups['Untagged'] = [];
          }
          groups['Untagged'].push(file);
        }
      } else {
        // Categories
        const category = file.category || 'Uncategorized';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(file);
      }
    });

    return groups;
  }, [files, viewMode]);

  const handleFileClick = (filePath: string) => {
    const encodedPath = encodeURIComponent(filePath);
    navigate(
      generatePath(ROUTES.admin.markdownViewerFile, {
        filePath: encodedPath,
      })
    );
    onFileSelect?.(filePath);
  };

  const displayItems = selectedFilter
    ? { [selectedFilter]: groupedFiles[selectedFilter] || [] }
    : groupedFiles;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Pills */}
      {availableItems.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter(null)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition',
                selectedFilter === null
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              All
            </button>
            {availableItems.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedFilter(item)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5',
                  selectedFilter === item
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {viewMode === 'tags' ? <Tag size={12} /> : <FolderOpen size={12} />}
                {item}
                <span className="text-gray-500 dark:text-gray-500">
                  ({groupedFiles[item]?.length || 0})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Files */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.keys(displayItems).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No files found with {viewMode === 'tags' ? 'tags' : 'categories'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(displayItems).map(([groupName, groupFiles]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  {viewMode === 'tags' ? (
                    <Tag size={16} className="text-blue-500" />
                  ) : (
                    <FolderOpen size={16} className="text-blue-500" />
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {groupName}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({groupFiles.length})
                  </span>
                </div>
                <div className="space-y-1 ml-6">
                  {groupFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file.path)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <FileText size={14} className="flex-shrink-0" />
                      <span className="flex-1 truncate text-sm">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
