import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_TAB = 'repurposer';

export function useContentPipelineTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => searchParams.get('tab') ?? DEFAULT_TAB);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTabState(tab);
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tabId: string) => {
      setActiveTabState(tabId);
      const next = new URLSearchParams(searchParams);
      next.set('tab', tabId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return { activeTab, setActiveTab };
}
