import { useState, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  FileCheck,
  BookOpen,
  CreditCard,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VaultItemType } from '@/types/knowledge-vault';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';

interface LinkedItemsPickerProps {
  value: string[];
  onChange: (itemIds: string[]) => void;
  excludeItemId?: string;
  className?: string;
}

const typeIcons = {
  note: FileText,
  document: FileCheck,
  course_lesson: BookOpen,
  flashcard: CreditCard,
};

const typeColors = {
  note: 'text-blue-600 dark:text-blue-400',
  document: 'text-purple-600 dark:text-purple-400',
  course_lesson: 'text-green-600 dark:text-green-400',
  flashcard: 'text-amber-600 dark:text-amber-400',
};

export default function LinkedItemsPicker({
  value,
  onChange,
  excludeItemId,
  className,
}: LinkedItemsPickerProps) {
  const { vaultItems } = useKnowledgeVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<VaultItemType | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Filter available items
  const availableItems = useMemo(() => {
    return vaultItems.filter((item) => {
      if (excludeItemId && item.id === excludeItemId) return false;
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.searchableText.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [vaultItems, excludeItemId, selectedType, searchQuery]);

  // Get linked items
  const linkedItems = useMemo(() => {
    return vaultItems.filter((item) => value.includes(item.id));
  }, [vaultItems, value]);

  const handleToggleItem = (itemId: string) => {
    if (value.includes(itemId)) {
      onChange(value.filter((id) => id !== itemId));
    } else {
      onChange([...value, itemId]);
    }
  };

  const handleRemoveLinked = (itemId: string) => {
    onChange(value.filter((id) => id !== itemId));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Linked Items
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
        >
          {isOpen ? 'Hide' : 'Add Items'}
        </button>
      </div>

      {/* Linked Items Display */}
      {linkedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linkedItems.map((item) => {
            const Icon = typeIcons[item.type];
            const colorClass = typeColors[item.type];
            return (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                <Icon size={14} className={colorClass} />
                <span className="text-gray-900 dark:text-white">{item.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLinked(item.id)}
                  className="ml-1 hover:text-red-600 dark:hover:text-red-400 transition"
                  aria-label={`Remove ${item.title}`}
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Picker Modal */}
      {isOpen && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm transition',
                  selectedType === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                All
              </button>
              {(['note', 'document', 'flashcard'] as VaultItemType[]).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm transition flex items-center gap-1.5',
                      selectedType === type
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon size={14} />
                    {type === 'note' ? 'Notes' : type === 'document' ? 'Documents' : 'Flashcards'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableItems.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                No items found
              </p>
            ) : (
              availableItems.map((item) => {
                const Icon = typeIcons[item.type];
                const colorClass = typeColors[item.type];
                const isLinked = value.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left',
                      isLinked
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon size={18} className={colorClass} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type} · {item.area}
                      </p>
                    </div>
                    {isLinked && (
                      <LinkIcon size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
