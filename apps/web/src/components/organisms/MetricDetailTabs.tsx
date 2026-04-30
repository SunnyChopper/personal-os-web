import { useState, useEffect, type ReactNode } from 'react';

export type MetricDetailTab =
  | 'overview'
  | 'trends'
  | 'patterns'
  | 'correlations'
  | 'predictions'
  | 'goals'
  | 'history';

interface MetricDetailTabsProps {
  activeTab: MetricDetailTab;
  onTabChange: (tab: MetricDetailTab) => void;
  children: ReactNode;
}

const TAB_STORAGE_KEY = 'metric-detail-active-tab';

export function MetricDetailTabs({ activeTab, onTabChange, children }: MetricDetailTabsProps) {
  const [currentTab, setCurrentTab] = useState<MetricDetailTab>(activeTab);

  useEffect(() => {
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY) as MetricDetailTab | null;
    if (
      savedTab &&
      [
        'overview',
        'trends',
        'patterns',
        'correlations',
        'predictions',
        'goals',
        'history',
      ].includes(savedTab)
    ) {
      setCurrentTab(savedTab);
      onTabChange(savedTab);
    }
  }, []);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: MetricDetailTab) => {
    setCurrentTab(tab);
    onTabChange(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  const tabs: Array<{ id: MetricDetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'correlations', label: 'Correlations' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'goals', label: 'Goals' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav
          className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide"
          aria-label="Metric detail tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                currentTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">{children}</div>
    </div>
  );
}
