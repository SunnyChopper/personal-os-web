import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  LogbookEntry,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
} from '@/types/growth-system';
import { useLogbook } from '@/hooks/useGrowthSystem';
import { useToast } from '@/hooks/use-toast';
import { LogbookHeader } from '@/components/molecules/LogbookHeader';
import { LogbookSearchBar } from '@/components/molecules/LogbookSearchBar';
import { LogbookViewToggle } from '@/components/molecules/LogbookViewToggle';
import { LogbookDetailView } from '@/components/organisms/LogbookDetailView';
import { LogbookListView } from '@/components/organisms/LogbookListView';
import { LogbookEditor } from '@/components/organisms/LogbookEditor';
import { DeleteEntryDialog } from '@/components/molecules/DeleteEntryDialog';
import BottomSheet from '@/components/molecules/BottomSheet';
import { filterLogbookEntries, sortLogbookEntriesByDate } from '@/utils/logbook-filters';
import { formatApiError } from '@/utils/api-error-formatter';

type ViewMode = 'list' | 'calendar';
type AIMode = 'prompts' | 'digest' | 'patterns' | 'sentiment' | 'review' | 'connections';

export default function LogbookPage() {
  const { entries: allEntries, isLoading, createEntry, updateEntry, deleteEntry } = useLogbook();
  const { showToast, ToastContainer } = useToast();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<LogbookEntry | null>(null);

  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<string | undefined>(undefined);

  // AI Assist State
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiMode, setAIMode] = useState<AIMode>('prompts');

  // Mutation State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    const filtered = filterLogbookEntries(allEntries || [], searchQuery);
    return sortLogbookEntriesByDate(filtered);
  }, [allEntries, searchQuery]);

  const handleDateClick = (date: Date) => {
    // Format as YYYY-MM-DD using local time to avoid timezone shifts
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split('T')[0];
    setSelectedDateForCreate(dateStr);
    setIsCreateDialogOpen(true);
  };

  const handleCreateEntry = async (input: CreateLogbookEntryInput) => {
    setIsSubmitting(true);
    try {
      const response = await createEntry(input);
      if (response.success && response.data) {
        setIsCreateDialogOpen(false);
        setSelectedDateForCreate(undefined);
        showToast({
          type: 'success',
          title: 'Entry created',
          message: 'Your logbook entry has been created successfully.',
        });
      } else {
        const errorMessage = formatApiError(response.error);
        showToast({
          type: 'error',
          title: 'Failed to create entry',
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to create entry:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create entry. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to create entry',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async (input: UpdateLogbookEntryInput) => {
    if (!selectedEntry) return;

    setIsSubmitting(true);
    try {
      const response = await updateEntry({ id: selectedEntry.id, input });
      if (response.success && response.data) {
        setSelectedEntry(response.data);
        setIsEditDialogOpen(false);
        showToast({
          type: 'success',
          title: 'Entry updated',
          message: 'Your logbook entry has been updated successfully.',
        });
      } else {
        const errorMessage = formatApiError(response.error);
        showToast({
          type: 'error',
          title: 'Failed to update entry',
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update entry. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to update entry',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await deleteEntry(entryToDelete.id);
      if (response.success) {
        if (selectedEntry && selectedEntry.id === entryToDelete.id) {
          setSelectedEntry(null);
        }
        setEntryToDelete(null);
        showToast({
          type: 'success',
          title: 'Entry deleted',
          message: 'Your logbook entry has been deleted successfully.',
        });
      } else {
        const errorMessage = formatApiError(response.error);
        showToast({
          type: 'error',
          title: 'Failed to delete entry',
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete entry. Please try again.';
      showToast({
        type: 'error',
        title: 'Failed to delete entry',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEntryClick = (entry: LogbookEntry) => {
    setSelectedEntry(entry);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe pb-safe">
      <AnimatePresence mode="wait">
        {selectedEntry ? (
          <LogbookDetailView
            key={`detail-${selectedEntry.id}`}
            entry={selectedEntry}
            allEntries={allEntries || []}
            onBack={handleBackToList}
            onEdit={() => setIsEditDialogOpen(true)}
            onDelete={() => setEntryToDelete(selectedEntry)}
            showAIAssist={showAIAssist}
            aiMode={aiMode}
            onToggleAIAssist={() => setShowAIAssist(!showAIAssist)}
            onAIModeChange={setAIMode}
          />
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
              <LogbookHeader onNewEntry={() => setIsCreateDialogOpen(true)} />

              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <LogbookSearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <LogbookViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>

              <LogbookListView
                entries={filteredAndSortedEntries}
                viewMode={viewMode}
                searchQuery={searchQuery}
                isLoading={isLoading}
                onEntryClick={handleEntryClick}
                onDateClick={handleDateClick}
                onCreateEntry={() => setIsCreateDialogOpen(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Use BottomSheet, Desktop: Use Dialog */}
      <BottomSheet
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedDateForCreate(undefined);
        }}
        title="New Logbook Entry"
        maxHeight="90vh"
      >
        <LogbookEditor
          defaultDate={selectedDateForCreate}
          onSubmit={(input) => handleCreateEntry(input as CreateLogbookEntryInput)}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setSelectedDateForCreate(undefined);
          }}
          isLoading={isSubmitting}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Edit Entry"
        maxHeight="90vh"
      >
        {selectedEntry && (
          <LogbookEditor
            entry={selectedEntry || undefined}
            onSubmit={(input) => handleUpdateEntry(input as UpdateLogbookEntryInput)}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </BottomSheet>

      <DeleteEntryDialog
        entry={entryToDelete}
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        isDeleting={isSubmitting}
      />

      <ToastContainer />
    </div>
  );
}
