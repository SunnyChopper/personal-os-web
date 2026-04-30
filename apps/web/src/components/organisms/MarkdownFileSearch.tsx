import { useState, useEffect } from 'react';
import { Search, X, FileText, Loader } from 'lucide-react';
import { useNavigate, generatePath } from 'react-router-dom';
import { markdownFilesService } from '@/services/markdown-files.service';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types/markdown-files';

interface MarkdownFileSearchProps {
  className?: string;
}

export default function MarkdownFileSearch({ className }: MarkdownFileSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'embedding'>('text');
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await markdownFilesService.searchFiles(query, searchType);
        if (response.success && response.data) {
          setResults(response.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  const handleResultClick = (filePath: string) => {
    const encodedPath = encodeURIComponent(filePath);
    navigate(
      generatePath(ROUTES.admin.markdownViewerFile, {
        filePath: encodedPath,
      })
    );
    setQuery('');
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Search Type Toggle */}
      {query && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setSearchType('text')}
            className={cn(
              'px-3 py-1 text-xs rounded transition',
              searchType === 'text'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Text
          </button>
          <button
            onClick={() => setSearchType('embedding')}
            className={cn(
              'px-3 py-1 text-xs rounded transition',
              searchType === 'embedding'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Semantic
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {query && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.file.path}-${index}`}
              onClick={() => handleResultClick(result.file.path)}
              className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
            >
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {result.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {result.file.path}
                </p>
                {result.matchScore !== undefined && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Match: {(result.matchScore * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !isSearching && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
        </div>
      )}
    </div>
  );
}
