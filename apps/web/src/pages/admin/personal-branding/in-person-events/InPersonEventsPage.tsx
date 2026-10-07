import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInPersonEvents, useInPersonEventsUnmountCleanup } from '@/hooks/useInPersonEvents';
import SubModuleTabShell from '../SubModuleTabShell';
import EventsCalendarTab from './EventsCalendarTab';
import EventsListTab from './EventsListTab';
import EventsRunsTab from './EventsRunsTab';
import EventsSettingsTab from './EventsSettingsTab';

const TABS = [
  { id: 'events', label: 'Events' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'runs', label: 'Runs' },
  { id: 'settings', label: 'Settings' },
] as const;

type InPersonEventsTabId = (typeof TABS)[number]['id'];
const DEFAULT_TAB_ID: InPersonEventsTabId = 'events';
const VALID_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveTabId(raw: string | null): InPersonEventsTabId {
  if (raw && VALID_TAB_IDS.has(raw)) return raw as InPersonEventsTabId;
  return DEFAULT_TAB_ID;
}

export default function InPersonEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = resolveTabId(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<InPersonEventsTabId>(tabFromUrl);
  const events = useInPersonEvents();
  useInPersonEventsUnmountCleanup();

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (tabId: string) => {
    const nextTab = resolveTabId(tabId);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    if (nextTab !== 'runs') nextParams.delete('runId');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <SubModuleTabShell
      tabs={TABS}
      defaultTabId={DEFAULT_TAB_ID}
      ariaLabel="In-Person Events sections"
      isLoading={events.isLoading}
      skeletonLayout="single-column"
      keepMounted
      activeTabId={activeTab}
      onTabChange={handleTabChange}
      renderPanel={(currentTab) => {
        if (currentTab === 'calendar') return <EventsCalendarTab events={events} />;
        if (currentTab === 'runs') return <EventsRunsTab />;
        if (currentTab === 'settings') return <EventsSettingsTab events={events} />;
        return <EventsListTab events={events} />;
      }}
    />
  );
}
