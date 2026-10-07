import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContentStream } from '@/hooks/useContentStream';
import { useToast } from '@/hooks/use-toast';
import SubModuleTabShell from '../SubModuleTabShell';
import ContentStreamSettingsTab from './ContentStreamSettingsTab';
import XShortPostsTab from './XShortPostsTab';

const TABS = [
  { id: 'x-short-posts', label: 'X/Twitter - Short Posts' },
  { id: 'settings', label: 'Settings' },
] as const;

type ContentStreamTabId = (typeof TABS)[number]['id'];

const DEFAULT_TAB_ID: ContentStreamTabId = 'x-short-posts';
const VALID_TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

function resolveTabId(raw: string | null): ContentStreamTabId {
  if (raw && VALID_TAB_IDS.has(raw)) {
    return raw as ContentStreamTabId;
  }
  return DEFAULT_TAB_ID;
}

export default function ContentStreamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = resolveTabId(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<ContentStreamTabId>(tabFromUrl);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const stream = useContentStream('x');
  const { showToast } = useToast();

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (tabId: string) => {
    const nextTab = resolveTabId(tabId);
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const isLoading = stream.settings.isPending || stream.posts.isPending;

  return (
    <div className="space-y-4">
      <SubModuleTabShell
        tabs={TABS}
        defaultTabId={DEFAULT_TAB_ID}
        ariaLabel="Content Stream sections"
        isLoading={isLoading}
        skeletonLayout="single-column"
        activeTabId={activeTab}
        onTabChange={handleTabChange}
        renderPanel={(currentTab) =>
          currentTab === 'settings' ? (
            <ContentStreamSettingsTab stream={stream} showToast={showToast} />
          ) : (
            <XShortPostsTab
              stream={stream}
              showToast={showToast}
              activeJobId={activeJobId}
              onJobIdChange={setActiveJobId}
            />
          )
        }
      />
    </div>
  );
}
