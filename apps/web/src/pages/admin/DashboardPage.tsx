import { useState, useMemo } from 'react';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import {
  CheckSquare,
  Calendar,
  TrendingUp,
  Target,
  FolderKanban,
  BookOpen,
  Heart,
  Film,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AIInsightsWidget } from '@/components/organisms/AIInsightsWidget';
import { DailyPlanningAssistant } from '@/components/organisms/DailyPlanningAssistant';
import { MorningLaunchpad } from '@/components/organisms/MorningLaunchpad';
import { GoalsDashboardWidget } from '@/components/organisms/GoalsDashboardWidget';
import { useMode } from '@/contexts/Mode';
import { ROUTES } from '@/routes';
import { useBackendStatus } from '@/contexts/BackendStatusContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  link: string;
  description: string;
  /** When true, shows skeleton placeholders for value and description instead of misleading zeros */
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, link, description, isLoading = false }: StatCardProps) => {
  return (
    <Link
      to={link}
      aria-busy={isLoading}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:accent-border-300 dark:hover:accent-border-600 hover:shadow-md transition group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 accent-bg-50 dark:bg-green-900/30 rounded-lg accent-text-600 dark:accent-text-400 group-hover:accent-bg-100 dark:group-hover:bg-green-900/50 transition flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <>
              <div
                className="h-9 w-16 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mb-2"
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
              <div
                className="mt-1 h-3 max-w-[85%] rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
                aria-hidden
              />
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{description}</p>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function DashboardPage() {
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const { isLeisureMode } = useMode();
  const { status: backendStatus } = useBackendStatus();

  const {
    tasks,
    goals,
    projects,
    habits,
    metrics,
    logbookEntries: entries,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useGrowthSystemDashboard();

  // Check if any data source has a network error
  // Only show error if we have a genuine error (not just during initial load)
  const hasNetworkError =
    dashboardError ||
    (!backendStatus.isOnline && backendStatus.lastError && !backendStatus.isChecking);

  const activeTasks = tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled');
  const activeHabits = habits.filter((h) => h.frequency === 'Daily');
  const activeGoals = goals.filter((g) => g.status === 'Active');
  const activeProjects = projects.filter((p) => p.status === 'Active');

  // Calculate simple progress for goals (for dashboard widget)
  const goalsProgress = useMemo(() => {
    const progressMap = new Map<string, number>();
    goals.forEach((goal) => {
      if (Array.isArray(goal.successCriteria)) {
        if (typeof goal.successCriteria[0] === 'string') {
          const completed = (goal.successCriteria as unknown as string[]).filter((c) =>
            c.includes('✓')
          ).length;
          const total = goal.successCriteria.length;
          progressMap.set(goal.id, total > 0 ? Math.round((completed / total) * 100) : 0);
        } else {
          const completed = goal.successCriteria.filter((c: any) => c.isCompleted).length;
          const total = goal.successCriteria.length;
          progressMap.set(goal.id, total > 0 ? Math.round((completed / total) * 100) : 0);
        }
      }
    });
    return progressMap;
  }, [goals]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isLeisureMode ? 'Leisure Dashboard' : 'Personal OS Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isLeisureMode
            ? 'Relax, recharge, and enjoy your personal time'
            : 'Track your progress and run your Personal OS'}
        </p>
      </div>

      {hasNetworkError && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Backend connection unavailable
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Unable to load data from the backend server. Statistics may be incomplete. Please
                check the connection status banner at the top of the page.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {!isLeisureMode && (
          <>
            <StatCard
              title="Active Tasks"
              value={activeTasks.length}
              icon={<CheckSquare size={24} />}
              link={ROUTES.admin.tasks}
              description={dashboardError ? 'Connection error' : `${tasks.length} total tasks`}
              isLoading={dashboardLoading}
            />
            <StatCard
              title="Metrics Tracked"
              value={metrics.length}
              icon={<TrendingUp size={24} />}
              link={ROUTES.admin.metrics}
              description={dashboardError ? 'Connection error' : 'Key performance indicators'}
              isLoading={dashboardLoading}
            />
            <StatCard
              title="Active Goals"
              value={activeGoals.length}
              icon={<Target size={24} />}
              link={ROUTES.admin.goals}
              description={dashboardError ? 'Connection error' : `${goals.length} total goals`}
              isLoading={dashboardLoading}
            />
            <StatCard
              title="Active Projects"
              value={activeProjects.length}
              icon={<FolderKanban size={24} />}
              link={ROUTES.admin.projects}
              description={
                dashboardError ? 'Connection error' : `${projects.length} total projects`
              }
              isLoading={dashboardLoading}
            />
          </>
        )}
        <StatCard
          title="Active Habits"
          value={activeHabits.length}
          icon={<Calendar size={24} />}
          link={ROUTES.admin.habits}
          description={dashboardError ? 'Connection error' : `${habits.length} total habits`}
          isLoading={dashboardLoading}
        />
        <StatCard
          title="Journal Entries"
          value={entries.length}
          icon={<BookOpen size={24} />}
          link={ROUTES.admin.logbook}
          description={dashboardError ? 'Connection error' : 'Daily reflections'}
          isLoading={dashboardLoading}
        />
        {isLeisureMode && (
          <>
            <StatCard
              title="Recovery Score"
              value={85}
              icon={<Heart size={24} />}
              link={ROUTES.admin.dashboard}
              description="Well-being indicator"
            />
            <StatCard
              title="Media Backlog"
              value={0}
              icon={<Film size={24} />}
              link={ROUTES.admin.mediaBacklog}
              description="Movies, shows & books"
            />
            <StatCard
              title="Hobby Quests"
              value={0}
              icon={<Star size={24} />}
              link={ROUTES.admin.hobbyQuests}
              description="Personal interests"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DailyPlanningAssistant onStartDay={() => setIsLaunchpadOpen(true)} />
        {!isLeisureMode && (
          <GoalsDashboardWidget
            goals={goals}
            goalsProgress={goalsProgress}
            isLoading={dashboardLoading}
          />
        )}
        <AIInsightsWidget />
      </div>

      <MorningLaunchpad isOpen={isLaunchpadOpen} onClose={() => setIsLaunchpadOpen(false)} />

      {!isLeisureMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Recent Tasks</h2>
            {dashboardError ? (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-600 dark:text-amber-400">Unable to load tasks</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Backend connection unavailable
                </p>
              </div>
            ) : dashboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse"
                  >
                    <div className="w-2 h-2 rounded-full mt-2 bg-gray-300 dark:bg-gray-600 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-[82%]" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTasks.length > 0 ? (
              <div className="space-y-2">
                {activeTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        task.priority === 'P1'
                          ? 'bg-red-500'
                          : task.priority === 'P2'
                            ? 'bg-orange-500'
                            : task.priority === 'P3'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {task.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                No active tasks
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Active Projects
            </h2>
            {dashboardError ? (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Unable to load projects
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Backend connection unavailable
                </p>
              </div>
            ) : dashboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse flex items-start justify-between gap-3"
                  >
                    <div className="h-4 flex-1 max-w-[72%] bg-gray-200 dark:bg-gray-600 rounded" />
                    <div className="h-3 w-14 shrink-0 bg-gray-200 dark:bg-gray-600 rounded mt-0.5" />
                  </div>
                ))}
              </div>
            ) : activeProjects.length > 0 ? (
              <div className="space-y-2">
                {activeProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {project.name}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                No active projects
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Recovery Activities
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
              Time to relax and recharge
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Leisure Suggestions
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
              Explore your hobbies and interests
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
