import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileTreeNode } from '@/types/markdown-files';
import MarkdownFileItem from './MarkdownFileItem';

interface MarkdownFolderItemProps {
  node: FileTreeNode;
  activeFilePath?: string;
  level?: number;
  onFileSelect?: (path: string) => void;
}

export default function MarkdownFolderItem({
  node,
  activeFilePath,
  level = 0,
  onFileSelect,
}: MarkdownFolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Auto-expand root level

  if (node.type !== 'folder') {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;
  const children = node.children || [];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
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
        {hasChildren && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{children.length}</span>
        )}
      </button>
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {children.map((child) => {
            if (child.type === 'folder') {
              return (
                <MarkdownFolderItem
                  key={child.path}
                  node={child}
                  activeFilePath={activeFilePath}
                  level={level + 1}
                  onFileSelect={onFileSelect}
                />
              );
            } else {
              return (
                <MarkdownFileItem
                  key={child.path}
                  node={child}
                  isActive={child.path === activeFilePath}
                  level={level + 1}
                  onSelect={onFileSelect}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
