import { useState, useEffect, type ReactNode } from 'react';

export type HabitDetailTab = 'overview' | 'activity' | 'analytics' | 'history';

interface HabitDetailTabsProps {
  activeTab: HabitDetailTab;
  onTabChange: (tab: HabitDetailTab) => void;
  children: ReactNode;
}

const TAB_STORAGE_KEY = 'habit-detail-active-tab';

export function HabitDetailTabs({ activeTab, onTabChange, children }: HabitDetailTabsProps) {
  const [currentTab, setCurrentTab] = useState<HabitDetailTab>(activeTab);

  useEffect(() => {
    // Load saved tab from localStorage
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY) as HabitDetailTab | null;
    if (savedTab && ['overview', 'activity', 'analytics', 'history'].includes(savedTab)) {
      setCurrentTab(savedTab);
      onTabChange(savedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: HabitDetailTab) => {
    setCurrentTab(tab);
    onTabChange(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  const tabs: Array<{ id: HabitDetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide touch-pan-x"
          aria-label="Habit detail tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-1 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap touch-manipulation shrink-0 ${
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
