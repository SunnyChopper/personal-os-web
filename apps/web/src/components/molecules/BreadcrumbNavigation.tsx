import { ChevronRight, Home } from 'lucide-react';
import { useNavigate, generatePath } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';

interface BreadcrumbNavigationProps {
  filePath: string;
  className?: string;
}

export default function BreadcrumbNavigation({ filePath, className }: BreadcrumbNavigationProps) {
  const navigate = useNavigate();

  // Split path into segments
  const pathSegments = filePath.split('/').filter(Boolean);
  const fileName = pathSegments[pathSegments.length - 1] || '';
  const folderSegments = pathSegments.slice(0, -1);

  const handleSegmentClick = (index: number) => {
    // Build path up to clicked segment
    const targetPath = pathSegments.slice(0, index + 1).join('/');
    const encodedPath = encodeURIComponent(targetPath);
    navigate(
      generatePath(ROUTES.admin.markdownViewerFile, {
        filePath: encodedPath,
      })
    );
  };

  const handleRootClick = () => {
    navigate(ROUTES.admin.markdownViewer);
  };

  return (
    <nav
      className={cn(
        'flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto',
        className
      )}
      aria-label="Breadcrumb"
    >
      <button
        onClick={handleRootClick}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="Go to markdown viewer root"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Markdown Viewer</span>
      </button>

      {folderSegments.length > 0 && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          {folderSegments.map((segment, index) => {
            const isLast = index === folderSegments.length - 1;
            return (
              <div key={segment} className="flex items-center gap-1">
                <button
                  onClick={() => handleSegmentClick(index)}
                  className={cn(
                    'px-2 py-1 rounded transition truncate max-w-[120px]',
                    isLast
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title={segment}
                >
                  {segment}
                </button>
                {!isLast && <ChevronRight size={14} className="text-gray-400" />}
              </div>
            );
          })}
        </>
      )}

      {fileName && (
        <>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="px-2 py-1 text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {fileName}
          </span>
        </>
      )}
    </nav>
  );
}
