import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, X as XIcon, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import MarkdownFileTree from '@/components/organisms/MarkdownFileTree';
import MarkdownViewer from '@/components/organisms/MarkdownViewer';
import FileUploadZone from '@/components/molecules/FileUploadZone';
import CreateFolderModal from '@/components/molecules/CreateFolderModal';
import EditFileMetadataModal from '@/components/molecules/EditFileMetadataModal';
import DeleteFileDialog from '@/components/molecules/DeleteFileDialog';
import { useMarkdownFiles } from '@/hooks/useMarkdownFiles';
import { createLocalFile } from '@/hooks/useLocalFiles';
import { cn } from '@/lib/utils';
import { useMarkdownFile } from '@/hooks/useMarkdownFile';
import { useFileDeletion } from '@/hooks/markdown/useFileDeletion';
import { useFileMetadata } from '@/hooks/markdown/useFileMetadata';
import { navigateToMarkdownFile } from '@/lib/markdown/navigation-utils';

export default function MarkdownViewerPage() {
  const params = useParams<{ filePath?: string }>();
  const navigate = useNavigate();
  // Sidebar starts closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024; // lg breakpoint
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [contextMenuFile, setContextMenuFile] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const { uploadFiles, isUploading } = useMarkdownFiles();
  const filePath = params.filePath ? decodeURIComponent(params.filePath) : undefined;

  // Get file for context menu actions
  const { file: contextFile } = useMarkdownFile(contextMenuFile || '');

  // New hooks
  const { deleteFileWithCleanup } = useFileDeletion();
  const { updateMetadata } = useFileMetadata();

  // Extract current folder path from filePath
  const currentFolderPath = filePath ? filePath.split('/').slice(0, -1).join('/') : '';

  // Handle window resize to auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when a file is selected
  // This effect ensures the sidebar closes even if navigation happens outside of handleFileSelect
  // Note: This is intentional - we need to sync UI state (sidebar) with route changes (filePath)
  useEffect(() => {
    if (filePath && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [filePath]);

  const handleNewFile = () => {
    // Create local file and navigate to it
    const localPath = createLocalFile();
    navigateToMarkdownFile(navigate, localPath);
  };

  const handleNewFolder = () => {
    setShowFolderModal(true);
  };

  const handleCreateFolder = async (folderPath: string) => {
    // TODO: Implement backend endpoint for folder creation
    // For now, this is a placeholder that invalidates the tree
    // The backend should implement POST /api/markdown-files/folders with { path: string }
    // Note: Backend needs to implement folder creation endpoint
    console.log('Folder creation requested:', folderPath);
    // For now, we'll just refresh the tree - the backend should handle actual folder creation
  };

  const handleUploadFiles = async (files: File[]) => {
    // Reset status
    setUploadStatus({ type: null, message: '' });

    try {
      const result = await uploadFiles(files);

      // Check if upload was successful
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        const uploadedCount = result.data?.length || files.length;
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}`,
        });

        // Auto-open the first uploaded file after successful upload
        if (result.data && result.data.length > 0) {
          const firstFile = result.data[0];
          navigateToMarkdownFile(navigate, firstFile.path);
        }

        // Close modal after a brief delay to show success message
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus({ type: null, message: '' });
        }, 2000);
      } else if (result && typeof result === 'object' && 'error' in result) {
        // Upload failed - show error and keep modal open
        const errorMessage = result.error?.message || 'Failed to upload files';
        setUploadStatus({
          type: 'error',
          message: errorMessage,
        });
      } else {
        // Unexpected result format
        setUploadStatus({
          type: 'error',
          message: 'Failed to upload files. Unexpected response format.',
        });
      }
    } catch (error) {
      // Error occurred - show error and keep modal open
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred during upload';
      setUploadStatus({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  const handleFileSelect = (_path: string) => {
    // File selection is handled by navigation in MarkdownFileItem
    // Close sidebar on mobile when file is selected
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleEditTags = (path: string) => {
    setContextMenuFile(path);
    setShowMetadataModal(true);
  };

  const handleRename = (path: string) => {
    // Navigate to file first, then the rename modal will be available in MarkdownViewer
    navigateToMarkdownFile(navigate, path);
    // Note: Rename modal is handled in MarkdownViewer component
  };

  const handleDelete = (path: string) => {
    setContextMenuFile(path);
    setShowDeleteDialog(true);
  };

  const handleOpenReaderMode = (path: string) => {
    // Navigate to file with reader mode query parameter
    navigateToMarkdownFile(navigate, path, { reader: true });
  };

  const handleDeleteConfirm = async () => {
    if (!contextMenuFile) return;

    try {
      await deleteFileWithCleanup(contextMenuFile, {
        navigateAfter: filePath === contextMenuFile,
      });

      // Close dialog and clean up
      setShowDeleteDialog(false);
      setContextMenuFile(null);
    } catch (error) {
      console.error('[MarkdownViewerPage] Failed to delete file:', error);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 lg:z-auto',
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'w-64 lg:w-80 flex-shrink-0',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'pt-16 lg:pt-0',
          'overflow-x-hidden overflow-y-auto'
        )}
      >
        <MarkdownFileTree
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onNewUpload={() => setShowUploadModal(true)}
          onNewFolder={handleNewFolder}
          onEditTags={handleEditTags}
          onRename={handleRename}
          onDelete={handleDelete}
          onOpenReaderMode={handleOpenReaderMode}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSidebarOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <MarkdownViewer filePath={filePath} />
      </div>

      {/* Floating Action Button for Mobile - Always visible when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 touch-manipulation"
          aria-label="Open files menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Upload Files Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!isUploading) {
                setShowUploadModal(false);
                setUploadStatus({ type: null, message: '' });
              }
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Files</h2>
              <button
                onClick={() => {
                  if (!isUploading) {
                    setShowUploadModal(false);
                    setUploadStatus({ type: null, message: '' });
                  }
                }}
                disabled={isUploading}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Upload Status Messages */}
              {isUploading && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Loader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    Uploading files...
                  </span>
                </div>
              )}

              {uploadStatus.type === 'success' && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    {uploadStatus.message}
                  </span>
                </div>
              )}

              {uploadStatus.type === 'error' && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-800 dark:text-red-300">
                    {uploadStatus.message}
                  </span>
                  <button
                    onClick={() => setUploadStatus({ type: null, message: '' })}
                    className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                    aria-label="Dismiss error"
                  >
                    <XIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              )}

              <FileUploadZone
                onFilesSelected={handleUploadFiles}
                accept=".md,.markdown"
                multiple={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={handleCreateFolder}
        currentPath={currentFolderPath}
      />

      {/* Edit Metadata Modal (from context menu) */}
      {showMetadataModal && contextFile && (
        <EditFileMetadataModal
          isOpen={showMetadataModal}
          onClose={() => {
            setShowMetadataModal(false);
            setContextMenuFile(null);
          }}
          file={contextFile}
          onSave={async (tags, category) => {
            if (!contextMenuFile) return;
            await updateMetadata(contextMenuFile, tags, category);
            setShowMetadataModal(false);
            setContextMenuFile(null);
          }}
        />
      )}

      {/* Delete Dialog (from context menu) */}
      {showDeleteDialog && contextMenuFile && (
        <DeleteFileDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setContextMenuFile(null);
          }}
          onConfirm={handleDeleteConfirm}
          fileName={contextMenuFile.split('/').pop() || 'Untitled'}
          filePath={contextMenuFile}
          isDeleting={false}
        />
      )}
    </div>
  );
}
