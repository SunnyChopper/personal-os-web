import { ArrowLeft, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogbookEntry } from '@/types/growth-system';
import { LogbookEntryMetadata } from '@/components/molecules/LogbookEntryMetadata';
import { LogbookAIModeSelector } from '@/components/molecules/LogbookAIModeSelector';
import { AILogbookAssistPanel } from '@/components/molecules/AILogbookAssistPanel';
import { llmConfig } from '@/lib/llm';
import { parseDateInput } from '@/utils/date-formatters';

type AIMode = 'prompts' | 'digest' | 'patterns' | 'sentiment' | 'review' | 'connections';

interface LogbookDetailViewProps {
  entry: LogbookEntry;
  allEntries: LogbookEntry[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showAIAssist: boolean;
  aiMode: AIMode;
  onToggleAIAssist: () => void;
  onAIModeChange: (mode: AIMode) => void;
}

export function LogbookDetailView({
  entry,
  allEntries,
  onBack,
  onEdit,
  onDelete,
  showAIAssist,
  aiMode,
  onToggleAIAssist,
  onAIModeChange,
}: LogbookDetailViewProps) {
  const isAIConfigured = llmConfig.isConfigured();

  return (
    <motion.div
      layoutId={`logbook-entry-${entry.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe pb-safe"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 md:mb-6 transition-colors -ml-2 p-2"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Logbook</span>
        </motion.button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {parseDateInput(entry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h1>
              </div>
              {entry.title && (
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {entry.title}
                </h2>
              )}
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <motion.button
                onClick={onEdit}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 rounded-full border-2 border-blue-400 bg-blue-400/20 dark:bg-blue-400/10 flex items-center justify-center text-white hover:bg-blue-400/30 dark:hover:bg-blue-400/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Edit entry"
              >
                <Edit2 className="w-5 h-5" strokeWidth={2} />
              </motion.button>
              <motion.button
                onClick={onDelete}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 rounded-full border-2 border-blue-400 bg-blue-400/20 dark:bg-blue-400/10 flex items-center justify-center text-white hover:bg-red-400/30 dark:hover:bg-red-400/20 hover:border-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete entry"
              >
                <Trash2 className="w-5 h-5" strokeWidth={2} />
              </motion.button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <LogbookEntryMetadata entry={entry} />
          </motion.div>

          {entry.notes && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="prose dark:prose-invert max-w-none mt-6"
            >
              <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {entry.notes}
              </div>
            </motion.div>
          )}

          {isAIConfigured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <LogbookAIModeSelector
                isExpanded={showAIAssist}
                currentMode={aiMode}
                onToggle={onToggleAIAssist}
                onModeChange={onAIModeChange}
              />

              <AnimatePresence>
                {showAIAssist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4"
                  >
                    <AILogbookAssistPanel
                      mode={aiMode}
                      entry={entry}
                      entries={allEntries}
                      onClose={() => onToggleAIAssist()}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
