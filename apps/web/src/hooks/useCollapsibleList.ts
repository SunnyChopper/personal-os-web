import { useState } from 'react';

export function useCollapsibleList<T>(items: T[], previewCount = 3) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCollapsibleList = items.length > previewCount;
  const hiddenCount = items.length - previewCount;
  const visibleItems = hasCollapsibleList && !isExpanded ? items.slice(0, previewCount) : items;

  return {
    visibleItems,
    hiddenCount,
    hasCollapsibleList,
    isExpanded,
    toggle: () => setIsExpanded((prev) => !prev),
    collapse: () => setIsExpanded(false),
  };
}
