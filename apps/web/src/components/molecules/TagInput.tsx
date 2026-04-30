import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledgeVault } from '@/contexts/KnowledgeVault';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder = 'Add a tag',
  className,
}: TagInputProps) {
  const { vaultItems } = useKnowledgeVault();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all existing tags from vault items with frequency
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    vaultItems.forEach((item) => {
      item.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [vaultItems]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) {
      return allTags.slice(0, 10); // Show top 10 most used tags
    }

    const query = inputValue.toLowerCase().trim();
    return allTags
      .filter(({ tag }) => {
        const lowerTag = tag.toLowerCase();
        return lowerTag.includes(query) && !value.includes(tag);
      })
      .slice(0, 10);
  }, [inputValue, allTags, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag?: string) => {
    const tagToAdd = (tag || inputValue.trim()).toLowerCase();
    if (tagToAdd && !value.includes(tagToAdd)) {
      onChange([...value, tagToAdd]);
      setInputValue('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleAddTag(suggestions[highlightedIndex].tag);
      } else {
        handleAddTag();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            placeholder={placeholder}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map(({ tag, count }, index) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className={cn(
                    'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-between',
                    highlightedIndex === index && 'bg-gray-100 dark:bg-gray-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TagIcon size={14} className="text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{tag}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {count} {count === 1 ? 'use' : 'uses'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleAddTag()}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              <TagIcon size={12} />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100 transition"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
