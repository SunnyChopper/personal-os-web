import { useState, useEffect, useRef } from 'react';
import {
  Edit,
  Save,
  X,
  Loader,
  FileEdit,
  AlertCircle,
  Trash2,
  Tag,
  BookOpen,
  Minimize2,
  CheckCircle,
} from 'lucide-react';
import { useMarkdownFile } from '@/hooks/useMarkdownFile';
import { useMarkdownBackendStatus } from '@/hooks/useMarkdownBackendStatus';
import MarkdownViewerContent from '@/components/molecules/MarkdownViewerContent';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import ReaderMode from '@/components/molecules/ReaderMode';
import LocalOnlyFileWarning from '@/components/molecules/LocalOnlyFileWarning';
import MarkdownBackendWarning from '@/components/molecules/MarkdownBackendWarning';
import DeleteFileDialog from '@/components/molecules/DeleteFileDialog';
import RenameFileModal from '@/components/molecules/RenameFileModal';
import { updateLocalFile, getLocalFile } from '@/hooks/useLocalFiles';
import { useFileTree } from '@/hooks/useFileTree';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import BreadcrumbNavigation from '@/components/molecules/BreadcrumbNavigation';
import { addRecentFile } from '@/hooks/useRecentFiles';
import EditFileMetadataModal from '@/components/molecules/EditFileMetadataModal';
import { useFileSave } from '@/hooks/markdown/useFileSave';
import { useFileRename } from '@/hooks/markdown/useFileRename';
import { useFileDeletion } from '@/hooks/markdown/useFileDeletion';
import { useFileMetadata } from '@/hooks/markdown/useFileMetadata';
import { useFileOperationFeedback } from '@/hooks/markdown/useFileOperationFeedback';
import { useModalState } from '@/hooks/markdown/useModalState';
import { extractErrorMessage } from '@/lib/react-query/error-utils';

interface MarkdownViewerProps {
  filePath: string | undefined;
}

export default function MarkdownViewer({ filePath }: MarkdownViewerProps) {
  const { file, isLoading, error, isUpdating, isLocalOnly } = useMarkdownFile(filePath);
  const { isOnline: isBackendOnline } = useMarkdownBackendStatus();
  const { isLoading: isFileTreeLoading } = useFileTree();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReloadingAfterSave, setIsReloadingAfterSave] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const filePathRef = useRef<string | undefined>(undefined);
  const fileContentRef = useRef<string | undefined>(undefined);

  // New hooks
  const { saveFile } = useFileSave();
  const { renameFile } = useFileRename();
  const { deleteFileWithCleanup } = useFileDeletion();
  const { updateMetadata } = useFileMetadata();
  const { saveError, saveSuccess, showError, clearMessages, setSaveError, setSaveSuccess } =
    useFileOperationFeedback();
  const {
    isRenameOpen: showRenameModal,
    isDeleteOpen: showDeleteDialog,
    isMetadataOpen: showMetadataModal,
    openModal,
    closeModal,
  } = useModalState();

  // Check for reader mode query parameter
  useEffect(() => {
    if (searchParams.get('reader') === 'true' && filePath && !isLoading) {
      setIsReaderMode(true);
      // Remove the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reader');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, filePath, isLoading, setSearchParams]);

  // Track recent files when file is viewed
  useEffect(() => {
    if (file && filePath && !isLocalOnly) {
      addRecentFile(file.path, file.name);
    }
  }, [file, filePath, isLocalOnly]);

  // Handle reload completion after save
  useEffect(() => {
    if (isReloadingAfterSave && file && !isLoading) {
      // File has finished reloading after save - now hide the overlay
      // Both states are set to false to ensure overlay disappears
      setIsReloadingAfterSave(false);
      setIsSaving(false);
    }
  }, [isReloadingAfterSave, file, isLoading]);

  // Reset state when filePath changes (using key-like behavior)
  // This is a valid pattern for syncing state from props/external data
  // We need to sync editedContent when the file changes to reset the editor
  // Note: This pattern is necessary for syncing editor state with file content changes
  useEffect(() => {
    const filePathChanged = filePath !== filePathRef.current;
    const contentChanged = file?.content !== fileContentRef.current;

    if (filePathChanged || contentChanged) {
      if (filePathChanged) {
        filePathRef.current = filePath;
        clearMessages(); // Clear any previous errors/success messages
        setIsReloadingAfterSave(false); // Reset reload state on file change
      }
      fileContentRef.current = file?.content;

      // For local-only files, always open in edit mode immediately
      if (isLocalOnly) {
        setIsEditing(true);
        // Initialize with content from localStorage or empty string
        const localFile = getLocalFile(filePath || '');
        setEditedContent(localFile?.content || '');
        // Local-only files always need to be saved to cloud, so enable Save button
        setHasChanges(true);
      } else {
        // For regular files, load content and start in view mode
        // Content will be a string (empty string if not yet loaded from S3)
        if (file) {
          setEditedContent(file.content || '');
          setHasChanges(false);
          setIsEditing(false);
        }
      }
    }
  }, [filePath, file, file?.content, isLocalOnly, clearMessages]);

  const handleSave = async () => {
    if (!filePath) return;
    // Allow saving local-only files even if content hasn't changed (they need to be saved to cloud)
    // For regular files, require hasChanges
    if (!isLocalOnly && !hasChanges) return;

    clearMessages();
    setIsSaving(true);
    setIsReloadingAfterSave(true);

    try {
      const result = await saveFile(filePath, editedContent, isLocalOnly);

      // Don't set isSaving to false yet - keep overlay showing until reload completes
      // After successful save, switch to view mode (but keep overlay visible)
      setIsEditing(false);
      setHasChanges(false);

      if (result.local) {
        setSaveSuccess('File saved locally');
      } else {
        setSaveSuccess('File saved successfully');
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);

      // Note: isSaving will be set to false when reload completes (see useEffect below)
    } catch (err) {
      setIsSaving(false);
      setIsReloadingAfterSave(false);
      const errorMessage = extractErrorMessage(err, 'Failed to save file');
      showError(errorMessage);
      console.error('Failed to save file:', err);
    }
  };

  const handleRename = async (newPath: string) => {
    if (!filePath) return;

    clearMessages();
    setIsRenaming(true);

    try {
      // Get current content
      const content = isLocalOnly
        ? editedContent || getLocalFile(filePath)?.content || ''
        : file?.content || editedContent || '';

      await renameFile(filePath, newPath, content);
      closeModal();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to rename file');
      showError(errorMessage);
      console.error('Failed to rename file:', err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!filePath) return;

    clearMessages();

    try {
      await deleteFileWithCleanup(filePath, {
        navigateAfter: true,
      });
      closeModal();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to delete file');
      showError(errorMessage);
      console.error('Failed to delete file:', err);
    }
  };

  const navigate = useNavigate();

  const handleCancel = () => {
    // Navigate away to show empty state
    navigate(ROUTES.admin.markdownViewer);
  };

  const handleContentChange = (newContent: string) => {
    setEditedContent(newContent);
    // For local-only files, always allow saving (they need to be saved to cloud)
    // For regular files, only mark as changed if content differs
    if (isLocalOnly) {
      setHasChanges(true);
    } else {
      setHasChanges(newContent !== file?.content);
    }

    // Auto-save to localStorage for local-only files
    if (isLocalOnly && filePath) {
      updateLocalFile(filePath, newContent);
    }
  };

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">No file selected</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Select a file from the sidebar to view its content
          </p>
        </div>
      </div>
    );
  }

  // Show full loading state when file tree is loading OR file is loading - hide everything
  // Check isFileTreeLoading OR isLoading OR if we have a filePath but no file data yet (and no error)
  if (isFileTreeLoading || (filePath && (isLoading || (!file && !error)))) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
        {/* Only show backend warning during loading */}
        <MarkdownBackendWarning />
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sticky top section - contains banners and header */}
      {/* On mobile, stick below AdminLayout header (64px = 16 * 4px) */}
      <div className="sticky top-16 lg:top-0 z-10 flex flex-col bg-white dark:bg-gray-900">
        {/* Markdown Backend Health Warning */}
        <MarkdownBackendWarning />

        {/* Warning Banner for Local-Only Files - only show if backend is online */}
        {/* When backend is offline, all files are saved locally, so this warning is redundant */}
        {isBackendOnline && isLocalOnly && filePath && <LocalOnlyFileWarning fileName={filePath} />}

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          </div>
        )}

        {/* Save Error Banner */}
        {saveError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{saveError}</span>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {/* Breadcrumb */}
          {filePath && (
            <div className="px-3 sm:px-4 pt-3 pb-2 overflow-x-auto">
              <BreadcrumbNavigation filePath={filePath} />
            </div>
          )}
          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-4 pb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {file?.name || filePath.split('/').pop() || 'Untitled'}
              </h2>
              {file?.path && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{file.path}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Action buttons - View mode: Edit, Tags, Rename, Delete | Edit mode: Cancel, Tags, Rename, Delete, Save */}
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsReaderMode(!isReaderMode)}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm rounded-lg transition',
                      isReaderMode
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    title="Reader mode"
                  >
                    {isReaderMode ? <Minimize2 size={16} /> : <BookOpen size={16} />}
                    <span className="hidden sm:inline">
                      {isReaderMode ? 'Exit Reader' : 'Reader'}
                    </span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                  >
                    <Edit size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => openModal('metadata')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Edit tags and category"
                  >
                    <Tag size={16} />
                    <span className="hidden sm:inline">Tags</span>
                  </button>
                  <button
                    onClick={() => openModal('rename')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Rename file"
                  >
                    <FileEdit size={16} />
                    <span className="hidden sm:inline">Rename</span>
                  </button>
                  <button
                    onClick={() => openModal('delete')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    disabled={isUpdating || isSaving}
                  >
                    <X size={16} />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={() => openModal('metadata')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Edit tags and category"
                  >
                    <Tag size={16} />
                    <span className="hidden sm:inline">Tags</span>
                  </button>
                  <button
                    onClick={() => openModal('rename')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Rename file"
                  >
                    <FileEdit size={16} />
                    <span className="hidden sm:inline">Rename</span>
                  </button>
                  <button
                    onClick={() => openModal('delete')}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={(!hasChanges && !isLocalOnly) || isSaving || isUpdating}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-sm rounded-lg transition',
                      (hasChanges || isLocalOnly) && !isSaving && !isUpdating
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span className="hidden sm:inline">Save</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reader Mode - Full Screen */}
      {isReaderMode && (
        <ReaderMode
          title={file?.name || filePath?.split('/').pop() || 'Untitled'}
          path={file?.path}
          content={
            isEditing
              ? editedContent
              : file?.content || editedContent || getLocalFile(filePath || '')?.content || ''
          }
          onClose={() => setIsReaderMode(false)}
        />
      )}

      {/* Content */}
      {!isReaderMode && (
        <div className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
          {/* Show spinner overlay when saving or reloading after save */}
          {(isSaving || isReloadingAfterSave) && (
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSaving ? 'Saving...' : 'Reloading content...'}
                </p>
              </div>
            </div>
          )}
          {isEditing || isLocalOnly ? (
            <MarkdownEditor
              value={editedContent}
              onChange={handleContentChange}
              placeholder="Start editing your markdown file..."
              minHeight="100%"
              className="h-full"
              fullWidth={true}
              onEnterReaderMode={() => setIsReaderMode(true)}
            />
          ) : (
            <div className="w-full max-w-none">
              <MarkdownViewerContent
                content={file?.content}
                isLoading={isLoading && !isReloadingAfterSave}
                error={error instanceof Error ? error : error ? new Error(error.message) : null}
                fullWidth={true}
                filePath={filePath}
              />
            </div>
          )}
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && filePath && (
        <RenameFileModal
          isOpen={showRenameModal}
          onClose={closeModal}
          onRename={handleRename}
          currentPath={filePath}
          currentName={file?.name || filePath.split('/').pop() || 'Untitled'}
          isRenaming={isRenaming}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && filePath && (
        <DeleteFileDialog
          isOpen={showDeleteDialog}
          onClose={closeModal}
          onConfirm={handleDelete}
          fileName={file?.name || filePath.split('/').pop() || 'Untitled'}
          filePath={filePath}
          isDeleting={isSaving}
        />
      )}

      {/* Edit Metadata Modal */}
      {showMetadataModal && file && (
        <EditFileMetadataModal
          isOpen={showMetadataModal}
          onClose={closeModal}
          file={file}
          onSave={async (tags, category) => {
            if (!filePath) return;
            await updateMetadata(filePath, tags, category);
          }}
        />
      )}
    </div>
  );
}
