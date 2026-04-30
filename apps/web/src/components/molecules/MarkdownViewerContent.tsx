import MarkdownRenderer from './MarkdownRenderer';
import { Loader } from 'lucide-react';

interface MarkdownViewerContentProps {
  content?: string;
  isLoading?: boolean;
  error?: Error | null;
  fullWidth?: boolean;
  filePath?: string;
}

export default function MarkdownViewerContent({
  content,
  isLoading,
  error,
  fullWidth = false,
  filePath,
}: MarkdownViewerContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-2">Failed to load file</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (content === undefined) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Select a file to view its content</p>
      </div>
    );
  }

  return (
    <div className={fullWidth ? 'w-full max-w-none' : 'px-4 py-6'}>
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6">
        <MarkdownRenderer content={content} filePath={filePath} />
      </div>
    </div>
  );
}
