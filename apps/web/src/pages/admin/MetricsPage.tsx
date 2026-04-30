import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Layers,
  Activity,
  Target,
  Grid3x3,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Smartphone,
  Hand,
  Watch,
  Database,
  BarChart3,
  Award,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Metric,
  MetricLog,
  CreateMetricInput,
  UpdateMetricInput,
  CreateMetricLogInput,
  FilterOptions,
  Goal,
  Area,
} from '@/types/growth-system';
import { useGoals, useMetrics } from '@/hooks/useGrowthSystem';
import Button from '@/components/atoms/Button';
import { MetricCard } from '@/components/molecules/MetricCard';
import { MetricLogForm } from '@/components/molecules/MetricLogForm';
import { MetricDetailTabs } from '@/components/organisms/MetricDetailTabs';
import { MetricTimeSeriesChart } from '@/components/molecules/MetricTimeSeriesChart';
import { MetricLogHistory } from '@/components/molecules/MetricLogHistory';
import { MetricInsightsPanel } from '@/components/molecules/MetricInsightsPanel';
import { MetricMilestoneSystem } from '@/components/organisms/MetricMilestoneSystem';
import { MetricComparisonView } from '@/components/molecules/MetricComparisonView';
import { MetricPredictions } from '@/components/molecules/MetricPredictions';
import { GoalMetricLink } from '@/components/molecules/GoalMetricLink';
import { MetricCoaching } from '@/components/molecules/MetricCoaching';
import { MetricEmptyStates } from '@/components/molecules/MetricEmptyStates';
import { MetricProgressRing } from '@/components/molecules/MetricProgressRing';
import { calculateProgress, getTrendData, getPeriodComparison } from '@/utils/metric-analytics';
import { SUBCATEGORY_LABELS, AREAS, AREA_LABELS } from '@/constants/growth-system';
import { MetricCreateForm } from '@/components/organisms/MetricCreateForm';
import { MetricEditForm } from '@/components/organisms/MetricEditForm';
import Dialog from '@/components/molecules/Dialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { llmConfig } from '@/lib/llm';
import {
  groupByArea,
  groupByStatus,
  groupByMomentum,
  sortByPriority,
  filterMetrics,
} from '@/utils/metric-grouping';

const STATUSES = ['Active', 'Paused', 'Archived'];

type ViewMode = 'grid' | 'list' | 'area' | 'status' | 'momentum' | 'priority';

export default function MetricsPage() {
  // Get cached metrics and goals from React Query
  const {
    metrics: cachedMetrics,
    isLoading: metricsLoading,
    createMetric,
    updateMetric,
    deleteMetric,
    logValue,
  } = useMetrics();
  const { goals: cachedGoals } = useGoals();

  // Use metrics from cache (they now include logs)
  const metrics = cachedMetrics;
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalMetrics, setGoalMetrics] = useState<Map<string, string[]>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [metricToLog, setMetricToLog] = useState<Metric | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<Metric | null>(null);

  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trends' | 'patterns' | 'correlations' | 'predictions' | 'goals' | 'history'
  >('overview');
  const isAIConfigured = llmConfig.isConfigured();

  const loadGoals = useCallback(() => {
    // Use cached goals
    if (cachedGoals.length > 0) {
      setGoals(cachedGoals);
    }

    // Build goal-metric relationships from cached data
    // For each goal, find metrics that have this goal in their goalIds array
    const goalMetricMap = new Map<string, string[]>();
    for (const goal of cachedGoals) {
      const linkedMetricIds = cachedMetrics
        .filter((metric) => metric.goalIds?.includes(goal.id) ?? false)
        .map((metric) => metric.id);
      if (linkedMetricIds.length > 0) {
        goalMetricMap.set(goal.id, linkedMetricIds);
      }
    }
    setGoalMetrics(goalMetricMap);
  }, [cachedGoals, cachedMetrics]);

  useEffect(() => {
    if (cachedGoals.length > 0 && cachedMetrics.length > 0) {
      loadGoals();
    }
  }, [cachedGoals, cachedMetrics, loadGoals]);

  // Update selectedMetric when metrics change (to get updated logs)
  useEffect(() => {
    if (selectedMetric) {
      const updatedMetric = metrics.find((m) => m.id === selectedMetric.id);
      if (updatedMetric && updatedMetric !== selectedMetric) {
        setSelectedMetric(updatedMetric);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  const handleCreateMetric = async (input: CreateMetricInput) => {
    setIsSubmitting(true);
    try {
      await createMetric(input);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create metric:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMetric = async (id: string, input: UpdateMetricInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateMetric({ id, input });
      if (response.success && response.data) {
        if (selectedMetric && selectedMetric.id === id) {
          setSelectedMetric(response.data);
        }
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update metric:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async () => {
    if (!metricToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteMetric(metricToDelete.id);
      if (selectedMetric && selectedMetric.id === metricToDelete.id) {
        setSelectedMetric(null);
      }
      setMetricToDelete(null);
    } catch (error) {
      console.error('Failed to delete metric:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogValue = async (input: CreateMetricLogInput) => {
    setIsSubmitting(true);
    try {
      await logValue(input);
      setIsLogDialogOpen(false);
      setMetricToLog(null);
      // Update selected metric if it's the one being logged
      if (selectedMetric && selectedMetric.id === input.metricId) {
        // The cache will be updated automatically, but we need to refresh the selected metric
        // Find the updated metric from the cache
        const updatedMetric = metrics.find((m) => m.id === input.metricId);
        if (updatedMetric) {
          setSelectedMetric(updatedMetric);
        }
      }
    } catch (error) {
      console.error('Failed to log value:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetricClick = (metric: Metric) => {
    setSelectedMetric(metric);
  };

  const handleBackToGrid = () => {
    setSelectedMetric(null);
  };

  const handleQuickLog = (metric: Metric) => {
    setMetricToLog(metric);
    setIsLogDialogOpen(true);
  };

  // Create a Map of logs for the filterMetrics utility (it expects a Map)
  const metricLogsMap = useMemo(() => {
    const map = new Map<string, MetricLog[]>();
    metrics.forEach((metric) => {
      if (metric.logs && metric.logs.length > 0) {
        map.set(metric.id, metric.logs);
      }
    });
    return map;
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    return filterMetrics(metrics, metricLogsMap, {
      area: filters.area,
      status: filters.status,
      momentum: filters.momentum,
      targetProximity: filters.targetProximity,
      loggingFrequency: filters.loggingFrequency,
      searchQuery,
    });
  }, [metrics, metricLogsMap, filters, searchQuery]);

  const activeFilterCount = [
    filters.area,
    filters.status,
    filters.momentum,
    filters.targetProximity,
    filters.loggingFrequency,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters({});
  };

  const groupedMetrics = useMemo(() => {
    switch (viewMode) {
      case 'area':
        return groupByArea(filteredMetrics);
      case 'status':
        return groupByStatus(filteredMetrics, metricLogsMap);
      case 'momentum':
        return groupByMomentum(filteredMetrics, metricLogsMap);
      case 'priority':
        return {
          Priority: sortByPriority(filteredMetrics, metricLogsMap, goals, goalMetrics),
        };
      default:
        return { All: filteredMetrics };
    }
  }, [filteredMetrics, viewMode, metricLogsMap, goals, goalMetrics]);

  if (selectedMetric) {
    const logs = selectedMetric.logs || [];
    const latestLog = logs.length > 0 ? logs[0] : null;
    const currentValue = latestLog?.value || 0;
    const progress = calculateProgress(
      currentValue,
      selectedMetric.targetValue,
      selectedMetric.direction
    );
    const trend = getTrendData(logs, selectedMetric);
    const comparison = getPeriodComparison(logs, 'week');

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBackToGrid}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Metrics
          </button>

          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedMetric.name}
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <AreaBadge area={selectedMetric.area} />
                  {selectedMetric.subCategory && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {SUBCATEGORY_LABELS[selectedMetric.subCategory]}
                    </span>
                  )}
                  <StatusBadge status={selectedMetric.status} size="sm" />
                </div>
                {selectedMetric.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {selectedMetric.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMetricToDelete(selectedMetric)}
                  className="hover:!bg-red-50 hover:!text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Value</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentValue.toFixed(selectedMetric.unit === 'dollars' ? 0 : 1)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedMetric.unit === 'custom'
                    ? selectedMetric.customUnit
                    : selectedMetric.unit}
                </div>
              </div>
              {selectedMetric.targetValue && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {progress.percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {progress.remaining?.toFixed(1) || 0} to target
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Logs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {latestLog
                    ? `Last: ${new Date(latestLog.loggedAt).toLocaleDateString()}`
                    : 'No logs'}
                </div>
              </div>
              {trend && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trend</div>
                  <div
                    className={`text-2xl font-bold ${trend.isImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {trend.changePercent >= 0 ? '+' : ''}
                    {trend.changePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {trend.velocity > 0 ? 'Improving' : trend.velocity < 0 ? 'Declining' : 'Stable'}
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights Button */}
            {isAIConfigured && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                  <Sparkles size={18} />
                  <span>AI Insights</span>
                  {showInsightsPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}
          </div>

          {/* Tabbed Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <MetricDetailTabs activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Progress Ring */}
                  {selectedMetric.targetValue && (
                    <div className="flex justify-center">
                      <MetricProgressRing
                        metric={selectedMetric}
                        currentValue={currentValue}
                        size="lg"
                        showLabel={true}
                        showTarget={true}
                      />
                    </div>
                  )}

                  {/* Coaching */}
                  <MetricCoaching metric={selectedMetric} logs={logs} />

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {comparison && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {comparison.current.period}
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {comparison.current.average.toFixed(1)}
                        </div>
                        <div
                          className={`text-xs mt-1 ${comparison.isImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {comparison.changePercent >= 0 ? '+' : ''}
                          {comparison.changePercent.toFixed(1)}% vs {comparison.previous.period}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Milestones Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Recent Achievements
                    </h3>
                    <MetricMilestoneSystem metric={selectedMetric} logs={logs} />
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <MetricTimeSeriesChart
                  metric={selectedMetric}
                  logs={logs}
                  height={400}
                  showTarget={true}
                  showTrend={true}
                  showAnomalies={true}
                  showPrediction={true}
                  showComparison={true}
                />
              )}

              {activeTab === 'patterns' && (
                <div className="space-y-6">
                  <MetricInsightsPanel
                    metric={selectedMetric}
                    logs={logs}
                    onClose={() => setShowInsightsPanel(false)}
                  />
                </div>
              )}

              {activeTab === 'correlations' && (
                <MetricComparisonView
                  primaryMetric={selectedMetric}
                  primaryLogs={logs}
                  allMetrics={metrics}
                  allLogs={metricLogsMap}
                  onMetricSelect={handleMetricClick}
                />
              )}

              {activeTab === 'predictions' && (
                <MetricPredictions metric={selectedMetric} logs={logs} />
              )}

              {activeTab === 'goals' && (
                <div className="space-y-6">
                  <GoalMetricLink
                    metric={selectedMetric}
                    logs={logs}
                    onLinkChange={() => loadGoals()}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Log History ({logs.length})
                    </h3>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleQuickLog(selectedMetric)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Log Value
                    </Button>
                  </div>
                  {logs.length === 0 ? (
                    <MetricEmptyStates
                      type="no_logs"
                      onLogValue={() => handleQuickLog(selectedMetric)}
                      metric={selectedMetric}
                    />
                  ) : (
                    <MetricLogHistory metric={selectedMetric} logs={logs} />
                  )}
                </div>
              )}
            </MetricDetailTabs>
          </div>

          {/* AI Insights Panel (Sidebar) */}
          {showInsightsPanel && (
            <MetricInsightsPanel
              metric={selectedMetric}
              logs={logs}
              onClose={() => setShowInsightsPanel(false)}
            />
          )}
        </div>

        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          title="Edit Metric"
          className="max-w-2xl"
        >
          <MetricEditForm
            metric={selectedMetric}
            onSubmit={handleUpdateMetric}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </Dialog>

        <Dialog
          isOpen={!!metricToDelete}
          onClose={() => setMetricToDelete(null)}
          title="Delete Metric"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this metric? This action cannot be undone.
            </p>
            {metricToDelete && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-semibold text-gray-900 dark:text-white">{metricToDelete.name}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setMetricToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteMetric}
                disabled={isSubmitting}
                className="!bg-red-600 hover:!bg-red-700"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Metric'}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Metrics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and measure your progress</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New Metric
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search metrics..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
            />
          </div>

          {/* View Mode Selector and Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(
                  [
                    { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
                    { mode: 'list' as const, icon: List, label: 'List' },
                    { mode: 'area' as const, icon: Layers, label: 'Area' },
                    { mode: 'status' as const, icon: Target, label: 'Status' },
                    { mode: 'momentum' as const, icon: Activity, label: 'Momentum' },
                    { mode: 'priority' as const, icon: Grid3x3, label: 'Priority' },
                  ] as const
                ).map(({ mode, icon: Icon, label }) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <motion.span
                    className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area
                </label>
                <select
                  value={filters.area || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, area: (e.target.value as Area) || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((area) => (
                    <option key={area} value={area}>
                      {AREA_LABELS[area]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div>
          {metricsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
              </div>
            </div>
          ) : filteredMetrics.length === 0 ? (
            metrics.length === 0 ? (
              <MetricEmptyStates
                type="no_metrics"
                onCreateMetric={() => setIsCreateDialogOpen(true)}
              />
            ) : (
              <EmptyState
                title="No metrics found"
                description={
                  searchQuery || filters.area || filters.status
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by creating your first metric'
                }
                actionLabel="Create Metric"
                onAction={() => setIsCreateDialogOpen(true)}
              />
            )
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {filteredMetrics.map((metric, index) => {
                      const logs = metric.logs || [];
                      const latestLog = logs.length > 0 ? logs[0] : null;
                      const currentValue = latestLog?.value ?? 0;
                      const progress = calculateProgress(
                        currentValue,
                        metric.targetValue,
                        metric.direction
                      );
                      const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

                      // Get status
                      const getStatus = () => {
                        if (!metric.targetValue) return 'No Target';
                        if (progress.isOnTrack) return 'On Track';
                        if (progress.percentage >= 50) return 'At Risk';
                        return 'Stalled';
                      };
                      const status = getStatus();
                      const statusColors = {
                        'On Track':
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                        'At Risk':
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
                        Stalled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                        'No Target':
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                      };

                      // Source icon mapping
                      const sourceIcons = {
                        App: Smartphone,
                        Manual: Hand,
                        Device: Watch,
                        API: Database,
                      };
                      const SourceIcon =
                        sourceIcons[metric.source as keyof typeof sourceIcons] || Database;

                      // Direction icon
                      const DirectionIcon =
                        metric.direction === 'Higher'
                          ? ArrowUp
                          : metric.direction === 'Lower'
                            ? ArrowDown
                            : Minus;

                      // Tracking frequency icon (if available from API response)
                      const trackingFrequency = metric.trackingFrequency;
                      const frequencyIcons = {
                        Daily: Calendar,
                        Weekly: BarChart3,
                        Monthly: Clock,
                      };
                      const FrequencyIcon =
                        trackingFrequency &&
                        frequencyIcons[trackingFrequency as keyof typeof frequencyIcons]
                          ? frequencyIcons[trackingFrequency as keyof typeof frequencyIcons]
                          : Clock;

                      return (
                        <motion.div
                          key={metric.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          onClick={() => handleMetricClick(metric)}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          whileHover={{
                            scale: 1.005,
                            borderColor: 'rgb(59, 130, 246)',
                            boxShadow:
                              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            transition: { duration: 0.15 },
                          }}
                          whileTap={{ scale: 0.998, transition: { duration: 0.15 } }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleMetricClick(metric);
                            }
                          }}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Left Section: Main Info */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header Row */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                      {metric.name}
                                    </h3>
                                    <AreaBadge area={metric.area} size="sm" />
                                  </div>
                                  {metric.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                      {metric.description}
                                    </p>
                                  )}
                                </div>
                                <div
                                  className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${statusColors[status as keyof typeof statusColors]}`}
                                >
                                  {status}
                                </div>
                              </div>

                              {/* Value and Progress Section */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Current Value */}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {currentValue.toFixed(metric.unit === 'dollars' ? 0 : 1)}
                                  </span>
                                  <span className="text-base text-gray-600 dark:text-gray-400">
                                    {unit}
                                  </span>
                                  <DirectionIcon
                                    className={`w-4 h-4 ${
                                      metric.direction === 'Higher'
                                        ? 'text-green-600 dark:text-green-400'
                                        : metric.direction === 'Lower'
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  />
                                </div>

                                {/* Progress Bar */}
                                {metric.targetValue && (
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                      <span>
                                        {progress.percentage.toFixed(0)}% of{' '}
                                        {metric.targetValue.toFixed(
                                          metric.unit === 'dollars' ? 0 : 1
                                        )}{' '}
                                        {unit}
                                      </span>
                                      {progress.remaining !== null && (
                                        <span className="text-gray-500 dark:text-gray-500">
                                          {progress.remaining > 0
                                            ? `${progress.remaining.toFixed(1)} ${unit} to go`
                                            : 'Target reached!'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <motion.div
                                        className={`h-full ${
                                          progress.isOnTrack
                                            ? 'bg-green-500 dark:bg-green-400'
                                            : progress.percentage >= 50
                                              ? 'bg-yellow-500 dark:bg-yellow-400'
                                              : 'bg-red-500 dark:bg-red-400'
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.percentage}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Metadata Row */}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {/* Baseline Comparison */}
                                {metric.baselineValue !== null &&
                                  metric.baselineValue !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <BarChart3 className="w-3.5 h-3.5" />
                                      <span>
                                        Baseline:{' '}
                                        {metric.baselineValue.toFixed(
                                          metric.unit === 'dollars' ? 0 : 1
                                        )}{' '}
                                        {unit}
                                      </span>
                                    </div>
                                  )}

                                {/* Tracking Frequency */}
                                {trackingFrequency && (
                                  <div className="flex items-center gap-1">
                                    <FrequencyIcon className="w-3.5 h-3.5" />
                                    <span>{trackingFrequency}</span>
                                  </div>
                                )}

                                {/* Source */}
                                <div className="flex items-center gap-1">
                                  <SourceIcon className="w-3.5 h-3.5" />
                                  <span>{metric.source}</span>
                                </div>

                                {/* Log Count */}
                                {logs.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Database className="w-3.5 h-3.5" />
                                    <span>
                                      {logs.length} log{logs.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}

                                {/* Milestone Count */}
                                {metric.milestoneCount !== undefined &&
                                  metric.milestoneCount > 0 && (
                                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                      <Award className="w-3.5 h-3.5" />
                                      <span>
                                        {metric.milestoneCount} milestone
                                        {metric.milestoneCount !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}

                                {/* Last Log Date */}
                                {latestLog && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                      Last: {new Date(latestLog.loggedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Section: Status Badge and Quick Actions */}
                            <div className="flex lg:flex-col items-center lg:items-end gap-3 flex-shrink-0">
                              <StatusBadge status={metric.status} size="sm" />
                              {metric.status === 'Active' && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickLog(metric);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center gap-1.5"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Log
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  Object.entries(groupedMetrics).map(([groupName, groupMetrics]) => (
                    <motion.div
                      key={groupName}
                      className="mb-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {viewMode !== 'grid' && (
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          {groupName} ({groupMetrics.length})
                        </h2>
                      )}
                      <div
                        className="grid gap-6 items-stretch"
                        style={{
                          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                        }}
                      >
                        {groupMetrics.map((metric, index) => (
                          <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="min-w-0"
                          >
                            <MetricCard
                              metric={metric}
                              logs={metric.logs || []}
                              onClick={handleMetricClick}
                              onQuickLog={handleQuickLog}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Create New Metric"
        className="max-w-2xl"
      >
        <MetricCreateForm
          onSubmit={handleCreateMetric}
          onCancel={() => setIsCreateDialogOpen(false)}
          isLoading={isSubmitting}
        />
      </Dialog>

      <Dialog
        isOpen={isLogDialogOpen}
        onClose={() => {
          setIsLogDialogOpen(false);
          setMetricToLog(null);
        }}
        title="Log Metric Value"
        className="max-w-lg"
      >
        {metricToLog && (
          <MetricLogForm
            metric={metricToLog}
            logs={metricToLog.logs || []}
            onSubmit={handleLogValue}
            onCancel={() => {
              setIsLogDialogOpen(false);
              setMetricToLog(null);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Dialog>

      <Dialog
        isOpen={!!metricToDelete}
        onClose={() => setMetricToDelete(null)}
        title="Delete Metric"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this metric? This action cannot be undone.
          </p>
          {metricToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white">{metricToDelete.name}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setMetricToDelete(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteMetric}
              disabled={isSubmitting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Metric'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
