import { useState } from 'react';
import { Package } from 'lucide-react';
import { AIConfidenceIndicator } from '@/components/atoms/AIConfidenceIndicator';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import Button from '@/components/atoms/Button';
import { DateDisplay } from '@/components/atoms/DateDisplay';
import { DependencyBadge } from '@/components/atoms/DependencyBadge';
import { EntityLinkChip } from '@/components/atoms/EntityLinkChip';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { AIInsightBanner } from '@/components/molecules/AIInsightBanner';
import { AISuggestionCard } from '@/components/molecules/AISuggestionCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { FilterPanel } from '@/components/molecules/FilterPanel';
import { QuickActionBar } from '@/components/molecules/QuickActionBar';
import { AIAssistPanel } from '@/components/organisms/AIAssistPanel';

export default function ComponentsDemoPage() {
  const [filters, setFilters] = useState({});
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  // Use useState with lazy initializer to calculate dates once without calling Date.now during render
  const [demoDates] = useState(() => {
    const now = Date.now();
    return {
      today: new Date(now).toISOString().split('T')[0],
      tomorrow: new Date(now + 86400000).toISOString().split('T')[0],
      yesterday: new Date(now - 86400000).toISOString().split('T')[0],
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Components Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Showcase of all shared UI components in Personal OS
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Entity Display Components
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Area Badges</h3>
            <div className="flex flex-wrap gap-2">
              <AreaBadge area="Health" />
              <AreaBadge area="Wealth" />
              <AreaBadge area="Love" />
              <AreaBadge area="Happiness" />
              <AreaBadge area="Operations" />
              <AreaBadge area="Day Job" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <AreaBadge area="Health" size="sm" />
              <AreaBadge area="Wealth" size="md" />
              <AreaBadge area="Love" size="lg" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Priority Indicators
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Badge variant:</p>
                <div className="flex flex-wrap gap-2">
                  <PriorityIndicator priority="P1" />
                  <PriorityIndicator priority="P2" />
                  <PriorityIndicator priority="P3" />
                  <PriorityIndicator priority="P4" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dot variant:</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <PriorityIndicator priority="P1" variant="dot" />
                  <PriorityIndicator priority="P2" variant="dot" />
                  <PriorityIndicator priority="P3" variant="dot" />
                  <PriorityIndicator priority="P4" variant="dot" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bar variant:</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <PriorityIndicator priority="P1" variant="bar" />
                  <PriorityIndicator priority="P2" variant="bar" />
                  <PriorityIndicator priority="P3" variant="bar" />
                  <PriorityIndicator priority="P4" variant="bar" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Status Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Not Started" />
              <StatusBadge status="In Progress" />
              <StatusBadge status="Blocked" />
              <StatusBadge status="On Hold" />
              <StatusBadge status="Done" />
              <StatusBadge status="Cancelled" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge status="Active" />
              <StatusBadge status="On Track" />
              <StatusBadge status="At Risk" />
              <StatusBadge status="Achieved" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Entity Link Chips
            </h3>
            <div className="flex flex-wrap gap-2">
              <EntityLinkChip id="1" label="Build authentication" type="task" />
              <EntityLinkChip id="2" label="MVP Development" type="project" />
              <EntityLinkChip id="3" label="Launch SaaS" type="goal" />
              <EntityLinkChip id="4" label="MRR" type="metric" />
              <EntityLinkChip id="5" label="Morning Exercise" type="habit" />
              <EntityLinkChip id="6" label="Daily Entry" type="logbook" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <EntityLinkChip
                id="1"
                label="With remove button"
                type="task"
                onRemove={() => alert('Removed')}
              />
              <EntityLinkChip
                id="2"
                label="Clickable chip"
                type="project"
                onClick={() => alert('Clicked')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Date Display</h3>
            <div className="space-y-3">
              <DateDisplay date={demoDates.today} label="Today" />
              <DateDisplay date={demoDates.tomorrow} label="Tomorrow" />
              <DateDisplay date={demoDates.yesterday} label="Yesterday (overdue)" />
              <DateDisplay date={null} label="No date" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Progress Rings
            </h3>
            <div className="flex flex-wrap gap-6">
              <ProgressRing progress={25} size="sm" />
              <ProgressRing progress={50} size="md" color="green" />
              <ProgressRing progress={75} size="lg" color="orange" />
              <ProgressRing progress={100} size="xl" color="purple" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Dependency Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              <DependencyBadge type="blocked" count={2} onClick={() => alert('Show blockers')} />
              <DependencyBadge type="blocking" count={3} onClick={() => alert('Show blocking')} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Interactive Components
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Filter Panel</h3>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              availableFilters={{
                areas: ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'],
                priorities: ['P1', 'P2', 'P3', 'P4'],
                statuses: ['Not Started', 'In Progress', 'Done'],
              }}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Empty State</h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <EmptyState
                icon={Package}
                title="No tasks yet"
                description="Get started by creating your first task. Tasks help you break down your goals into actionable items."
                actionLabel="Create Task"
                onAction={() => alert('Create task')}
                secondaryActionLabel="Import Tasks"
                onSecondaryAction={() => alert('Import')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Quick Action Bar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select items to see the quick action bar (it appears at the bottom)
            </p>
            <Button onClick={() => setSelectedCount(selectedCount > 0 ? 0 : 3)} variant="secondary">
              {selectedCount > 0 ? 'Clear Selection' : 'Select 3 Items'}
            </Button>
            <QuickActionBar
              selectedCount={selectedCount}
              onClear={() => setSelectedCount(0)}
              actions={[
                {
                  label: 'Complete',
                  icon: 'complete',
                  variant: 'success',
                  onClick: () => alert('Complete'),
                },
                {
                  label: 'Delete',
                  icon: 'delete',
                  variant: 'danger',
                  onClick: () => alert('Delete'),
                },
              ]}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">AI Components</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              AI Confidence Indicator
            </h3>
            <div className="space-y-2">
              <AIConfidenceIndicator confidence={90} />
              <AIConfidenceIndicator confidence={70} />
              <AIConfidenceIndicator confidence={50} />
              <AIConfidenceIndicator confidence={30} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              AI Thinking Indicator
            </h3>
            <AIThinkingIndicator />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              AI Insight Banners
            </h3>
            <div className="space-y-3">
              <AIInsightBanner
                title="Progress Update"
                content="You're on track to complete 3 tasks this week. Keep up the momentum!"
                severity="info"
              />
              <AIInsightBanner
                title="Attention Needed"
                content="Task 'Build API' is blocked by 2 dependencies. Consider prioritizing them."
                severity="warning"
              />
              <AIInsightBanner
                title="Critical Issue"
                content="Your quarterly goal is at risk. Only 30 days remaining with 60% completion."
                severity="critical"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              AI Suggestion Cards
            </h3>
            <div className="space-y-3">
              <AISuggestionCard
                title="Break down this task"
                description="This task seems complex. I can help break it into smaller subtasks."
                confidence={85}
                reasoning="Based on the task description, I identified 4 distinct steps that could be separate tasks."
                onAccept={() => alert('Accepted')}
                onDismiss={() => alert('Dismissed')}
              />
              <AISuggestionCard
                title="Quick suggestion"
                description="Consider adding a due date to stay on track."
                variant="compact"
                onDismiss={() => alert('Dismissed')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              AI Assist Panel
            </h3>
            <Button onClick={() => setShowAIPanel(true)} variant="primary">
              Open AI Assistant
            </Button>
            <AIAssistPanel
              isOpen={showAIPanel}
              onClose={() => setShowAIPanel(false)}
              title="Task Breakdown Assistant"
            >
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Based on your task description, here are some suggested subtasks:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">
                      1. Set up project structure
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated: 2 hours
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">
                      2. Implement core features
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated: 8 hours
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">3. Write tests</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated: 3 hours
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowAIPanel(false)} variant="primary" className="w-full">
                  Apply Suggestions
                </Button>
              </div>
            </AIAssistPanel>
          </div>
        </div>
      </section>
    </div>
  );
}
