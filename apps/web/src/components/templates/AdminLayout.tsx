import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/Auth';
import { useMode } from '@/contexts/Mode';
import { AdminShellProvider, useAdminShell } from '@/contexts/AdminShellContext';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  TrendingUp,
  FolderKanban,
  BookOpen,
  Calendar,
  LogOut,
  Menu,
  X,
  Settings,
  Activity,
  Brain,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Command,
  Film,
  Star,
  Coffee,
  Store,
  Library,
  GraduationCap,
  Network,
  Globe,
  Layers,
  Sparkles,
  Inbox,
  Container,
  Wrench,
  Workflow,
  Clock,
  LayoutGrid,
  FileText,
  ClipboardList,
  Shield,
  Zap,
  Link2,
  Newspaper,
  BarChart2,
  Ship,
  Dumbbell,
  Briefcase,
} from 'lucide-react';
import LeisureModeToggle from '@/components/atoms/LeisureModeToggle';
import { CommandPalette } from '@/components/organisms/CommandPalette';
import { WalletWidget } from '@/components/molecules/WalletWidget';
import { BackendStatusBanner } from '@/components/molecules/BackendStatusBanner';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import { taskLinksService } from '@/services/knowledge-vault/task-links.service';

const DebugInspector = lazy(() =>
  import('@/components/organisms/DebugInspector').then((m) => ({ default: m.DebugInspector }))
);

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: NavItem[];
  /** When true, this leaf is active only on an exact pathname match (avoids `/career` matching `/career/resume`). */
  exact?: boolean;
  hideInLeisure?: boolean;
  hideInWork?: boolean;
}

/** Match this item or any nested child route (for Tools sub-sub navigation). */
function navSubtreeContainsPath(item: NavItem, pathname: string): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return item.children?.some((c) => navSubtreeContainsPath(c, pathname)) ?? false;
}

const toolsNavigationChildren: NavItem[] = [
  { name: 'Overview', href: ROUTES.admin.tools.base, icon: LayoutGrid },
  { name: 'Markdown', href: ROUTES.admin.markdownViewer, icon: FileText },
  { name: 'Reward Studio', href: ROUTES.admin.rewardStudio, icon: Sparkles },
  {
    name: 'Orchestration',
    href: ROUTES.admin.tools.workflows,
    icon: Workflow,
    children: [
      { name: 'Workflow Engine', href: ROUTES.admin.tools.workflows, icon: Workflow },
      { name: 'Cron Builder', href: ROUTES.admin.tools.cronBuilder, icon: Clock },
    ],
  },
  {
    name: 'Network',
    href: ROUTES.admin.tools.postman,
    icon: Globe,
    children: [
      { name: 'Local Postman', href: ROUTES.admin.tools.postman, icon: Globe },
      { name: 'Webhook Catcher', href: ROUTES.admin.tools.webhooks, icon: Network },
    ],
  },
  { name: 'Whiteboard', href: ROUTES.admin.tools.whiteboard, icon: LayoutGrid },
  {
    name: 'Data & Security',
    href: ROUTES.admin.tools.formatters,
    icon: Shield,
    children: [
      { name: 'Formatters', href: ROUTES.admin.tools.formatters, icon: Shield },
      { name: 'JWT Decoder', href: ROUTES.admin.tools.jwt, icon: Shield },
      { name: 'Base64', href: ROUTES.admin.tools.base64, icon: Shield },
      { name: 'Regex Sandbox', href: ROUTES.admin.tools.regex, icon: Shield },
    ],
  },
  {
    name: 'DevOps',
    href: ROUTES.admin.tools.docker,
    icon: Container,
    children: [
      { name: 'Docker Compose', href: ROUTES.admin.tools.docker, icon: Container },
      { name: 'ESLint config', href: ROUTES.admin.tools.eslint, icon: Container },
    ],
  },
];

const workNavigation: NavItem[] = [
  { name: 'Dashboard', href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  {
    name: 'Assistant',
    href: ROUTES.admin.assistant,
    icon: MessageCircle,
    children: [
      { name: 'Settings', href: ROUTES.admin.assistantToolSafety, icon: Shield },
      { name: 'Proactive', href: ROUTES.admin.assistantProactive, icon: Zap },
      { name: 'Observability', href: ROUTES.admin.assistantObservability, icon: BarChart2 },
      { name: 'Memory Audit', href: ROUTES.admin.memoryAudit, icon: ClipboardList },
    ],
  },
  {
    name: 'Growth System',
    href: ROUTES.admin.growthSystem,
    icon: Activity,
    children: [
      { name: 'Tasks', href: ROUTES.admin.tasks, icon: CheckSquare },
      { name: 'Habits', href: ROUTES.admin.habits, icon: Calendar },
      { name: 'Metrics', href: ROUTES.admin.metrics, icon: TrendingUp },
      { name: 'Goals', href: ROUTES.admin.goals, icon: Target },
      { name: 'Projects', href: ROUTES.admin.projects, icon: FolderKanban },
      { name: 'Logbook', href: ROUTES.admin.logbook, icon: BookOpen },
      { name: 'Weekly Review', href: ROUTES.admin.weeklyReview, icon: Calendar },
      { name: 'Planner', href: ROUTES.admin.planner, icon: LayoutGrid },
    ],
  },
  {
    name: 'Health & Fitness',
    href: ROUTES.admin.healthFitness,
    icon: Dumbbell,
    children: [
      { name: 'Overview', href: ROUTES.admin.healthFitness, icon: LayoutGrid },
      { name: 'Nutrition', href: ROUTES.admin.healthFitnessNutrition, icon: Coffee },
      { name: 'Workouts', href: ROUTES.admin.healthFitnessWorkouts, icon: Dumbbell },
      { name: 'Aura', href: ROUTES.admin.healthFitnessAura, icon: Sparkles },
    ],
  },
  {
    name: 'Knowledge Vault',
    href: ROUTES.admin.knowledgeVault,
    icon: Brain,
    children: [
      { name: 'Library', href: ROUTES.admin.knowledgeVaultLibrary, icon: Library },
      { name: 'Inbox', href: ROUTES.admin.knowledgeVaultInbox, icon: Inbox },
      { name: 'Courses', href: ROUTES.admin.knowledgeVaultCourses, icon: GraduationCap },
      { name: 'Flashcards', href: ROUTES.admin.knowledgeVaultFlashcards, icon: Layers },
      { name: 'Skill Tree', href: ROUTES.admin.knowledgeVaultSkillTree, icon: Network },
      { name: 'Concept Collider', href: ROUTES.admin.knowledgeVaultCollider, icon: Sparkles },
      { name: 'Compare Sources', href: ROUTES.admin.knowledgeVaultSyntopic, icon: FileText },
      { name: 'Cheat Sheets', href: ROUTES.admin.knowledgeVaultCheatSheet, icon: ClipboardList },
      { name: 'Task Links', href: ROUTES.admin.knowledgeVaultTaskLinks, icon: Link2 },
      { name: 'Daily Learning', href: ROUTES.admin.knowledgeVaultDailyLearning, icon: Newspaper },
    ],
  },
  {
    name: 'Career',
    href: ROUTES.admin.careerDevelopment,
    icon: Briefcase,
    children: [
      {
        name: 'Overview',
        href: ROUTES.admin.careerDevelopment,
        icon: LayoutGrid,
        exact: true,
      },
      { name: 'Resume Builder', href: ROUTES.admin.careerResume, icon: FileText },
    ],
  },
  {
    name: 'Tools',
    href: ROUTES.admin.tools.base,
    icon: Wrench,
    children: toolsNavigationChildren,
  },
  { name: 'Settings', href: ROUTES.admin.settings, icon: Settings },
];

const leisureNavigation: NavItem[] = [
  { name: 'Zen Dashboard', href: ROUTES.admin.zenDashboard, icon: Coffee },
  { name: 'Voyager', href: ROUTES.admin.voyagerTrips, icon: Ship },
  { name: 'Logbook', href: ROUTES.admin.logbook, icon: BookOpen },
  { name: 'Media Backlog', href: ROUTES.admin.mediaBacklog, icon: Film },
  { name: 'Hobby Quests', href: ROUTES.admin.hobbyQuests, icon: Star },
  { name: 'Rewards Store', href: ROUTES.admin.rewardsStore, icon: Store },
  {
    name: 'Assistant',
    href: ROUTES.admin.assistant,
    icon: MessageCircle,
    children: [
      { name: 'Settings', href: ROUTES.admin.assistantToolSafety, icon: Shield },
      { name: 'Proactive', href: ROUTES.admin.assistantProactive, icon: Zap },
      { name: 'Observability', href: ROUTES.admin.assistantObservability, icon: BarChart2 },
      { name: 'Memory Audit', href: ROUTES.admin.memoryAudit, icon: ClipboardList },
    ],
  },
  { name: 'Settings', href: ROUTES.admin.settings, icon: Settings },
];

/** True when pathname is the group root or any nested child route (supports Tools sub-sub items). */
function navGroupContainsPath(item: NavItem, pathname: string): boolean {
  return navSubtreeContainsPath(item, pathname);
}

/**
 * Stable key for expand/collapse + route-collapsed tracking. Parent/child may share the same
 * `href` (e.g. Orchestration group vs Workflow Engine), so href alone is not unique.
 */
function navExpandKey(item: NavItem): string {
  return `${item.name}::${item.href}`;
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 256; // w-64 = 256px

// Min/max widths based on breakpoints
const getMinWidth = () => {
  if (typeof window === 'undefined') return 200;
  if (window.innerWidth >= 1024) return 240; // lg: 1024px+
  if (window.innerWidth >= 768) return 220; // md: 768px+
  return 200; // sm and below
};

const getMaxWidth = () => {
  if (typeof window === 'undefined') return 400;
  if (window.innerWidth >= 1024) return 480; // lg: 1024px+
  if (window.innerWidth >= 768) return 400; // md: 768px+
  return 320; // sm and below
};

function AdminLayoutContent() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isLeisureMode } = useMode();
  const { mainNavOpen, toggleMainNav, closeMainNav, assistantChatsOpen, toggleAssistantChats } =
    useAdminShell();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  /** When user collapses a group while the route would keep it open, store pathname at collapse time so it clears on navigation without an effect. */
  const [routeCollapsedAt, setRouteCollapsedAt] = useState<Record<string, string>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    return stored
      ? Math.max(getMinWidth(), Math.min(getMaxWidth(), parseInt(stored, 10)))
      : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const isFullBleedRoute =
    location.pathname.startsWith('/admin/markdown-viewer') ||
    location.pathname.startsWith('/admin/assistant') ||
    location.pathname.startsWith('/admin/tools/whiteboard');
  const isAssistantRoute = location.pathname.startsWith('/admin/assistant');
  const isCompactAdminOutlet = location.pathname.includes('/knowledge-vault/daily-learning');

  const navigation = isLeisureMode ? leisureNavigation : workNavigation;
  const prevNavPathRef = useRef(location.pathname);

  const vaultTaskLinkBadgeQuery = useQuery({
    queryKey: ['vault-task-links-unack-count'],
    queryFn: async () => {
      const d = await taskLinksService.listUnacknowledged();
      return d?.items?.length ?? 0;
    },
    refetchInterval: 60_000,
    enabled: !isLeisureMode,
  });
  const vaultLinkBadge = vaultTaskLinkBadgeQuery.data ?? 0;

  const clearRouteCollapseForExpandKey = useCallback((expandKey: string) => {
    setRouteCollapsedAt((prev) => {
      if (!(expandKey in prev)) return prev;
      const next = { ...prev };
      delete next[expandKey];
      return next;
    });
  }, []);

  /**
   * Entering a group's root from elsewhere must drop a stale "collapsed on this root" flag
   * (otherwise child→parent navigation briefly opens then snaps shut). Same for browser back/forward.
   * Intentional URL→UI sync; not derivable without tracking previous pathname.
   */
  useEffect(() => {
    const path = location.pathname;
    const prev = prevNavPathRef.current;
    prevNavPathRef.current = path;
    if (path === prev) return;

    const clearStaleForTree = (items: NavItem[]) => {
      for (const item of items) {
        if (!item.children?.length) continue;
        if (path === item.href && prev !== item.href) {
          const k = navExpandKey(item);
          /* eslint-disable-next-line react-hooks/set-state-in-effect -- pathname transition is the external signal */
          setRouteCollapsedAt((p) => {
            if (!(k in p)) return p;
            const next = { ...p };
            delete next[k];
            return next;
          });
        }
        clearStaleForTree(item.children);
      }
    };
    clearStaleForTree(navigation);
  }, [location.pathname, navigation]);

  const isNavGroupExpanded = (item: NavItem): boolean => {
    if (!item.children?.length) return false;
    const k = navExpandKey(item);
    const collapsedForPath = routeCollapsedAt[k];
    if (collapsedForPath && collapsedForPath === location.pathname) return false;
    if (navGroupContainsPath(item, location.pathname)) return true;
    return expandedItems.includes(k);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleExpanded = (item: NavItem) => {
    if (!item.children?.length) return;
    const k = navExpandKey(item);
    const pathOpen = navGroupContainsPath(item, location.pathname);
    const currentlyOpen = isNavGroupExpanded(item);

    if (currentlyOpen) {
      setExpandedItems((prev) => prev.filter((key) => key !== k));
      if (pathOpen) {
        setRouteCollapsedAt((prev) => ({ ...prev, [k]: location.pathname }));
      }
    } else {
      setExpandedItems((prev) => [...new Set([...prev, k])]);
      setRouteCollapsedAt((prev) => {
        if (!(k in prev)) return prev;
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const isItemActive = (item: NavItem): boolean => navSubtreeContainsPath(item, location.pathname);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle resize on window resize to update min/max constraints
  useEffect(() => {
    const handleResize = () => {
      const minWidth = getMinWidth();
      const maxWidth = getMaxWidth();
      setSidebarWidth((prev) => Math.max(minWidth, Math.min(maxWidth, prev)));
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = sidebarWidth;
    },
    [sidebarWidth]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = resizeStartWidth.current + deltaX;
      const minWidth = getMinWidth();
      const maxWidth = getMaxWidth();

      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setSidebarWidth(constrainedWidth);
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const renderNavBranch = (items: NavItem[], depth: number) =>
    items.map((child) => {
      const nested = child.children?.length;
      if (nested) {
        const ChildIcon = child.icon;
        const isNestedExpanded = isNavGroupExpanded(child);
        const isGrpActive = isItemActive(child);
        return (
          <div
            key={navExpandKey(child)}
            className={
              depth > 0 ? 'ml-2 mt-0.5 border-l border-gray-200 pl-2 dark:border-gray-700' : ''
            }
          >
            <div
              className={`flex items-stretch rounded-lg transition ${
                isGrpActive
                  ? 'accent-bg-50 dark:bg-green-900/30 accent-text-700 dark:accent-text-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Link
                to={child.href}
                onClick={() => {
                  clearRouteCollapseForExpandKey(navExpandKey(child));
                  closeMainNav();
                }}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-l-lg leading-snug ${
                  depth > 0 ? 'px-3 py-2.5' : 'px-4 py-2.5'
                }`}
              >
                <span className="shrink-0">
                  <ChildIcon size={depth > 0 ? 16 : 18} />
                </span>
                <span className="flex-1 truncate text-left text-sm">{child.name}</span>
                {child.href === ROUTES.admin.knowledgeVaultTaskLinks && vaultLinkBadge > 0 && (
                  <span className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {vaultLinkBadge > 99 ? '99+' : vaultLinkBadge}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => toggleExpanded(child)}
                aria-expanded={isNestedExpanded}
                aria-label={
                  isNestedExpanded
                    ? `Collapse ${child.name} submenu`
                    : `Expand ${child.name} submenu`
                }
                className="flex shrink-0 items-center justify-center self-stretch rounded-r-lg border-l border-gray-200/80 px-2 py-2 dark:border-gray-600/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                {isNestedExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
            {isNestedExpanded && (
              <div className="mt-2 space-y-1.5 pb-0.5">
                {renderNavBranch(child.children!, depth + 1)}
              </div>
            )}
          </div>
        );
      }
      const ChildIcon = child.icon;
      const isChildActive = child.exact
        ? location.pathname === child.href
        : location.pathname === child.href || location.pathname.startsWith(`${child.href}/`);
      return (
        <Link
          key={`${child.name}-${child.href}`}
          to={child.href}
          onClick={closeMainNav}
          className={`flex min-h-10 items-center gap-3 rounded-lg px-4 py-2.5 text-sm leading-snug transition ${
            depth > 0 ? 'pl-3' : ''
          } ${
            isChildActive
              ? 'accent-bg-50 dark:bg-green-900/30 accent-text-700 dark:accent-text-400 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChildIcon size={depth > 0 ? 16 : 18} />
          <span className="flex-1">{child.name}</span>
          {child.href === ROUTES.admin.knowledgeVaultTaskLinks && vaultLinkBadge > 0 && (
            <span className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {vaultLinkBadge > 99 ? '99+' : vaultLinkBadge}
            </span>
          )}
        </Link>
      );
    });

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div
      className={cn(
        'flex flex-col bg-gray-50 dark:bg-gray-900',
        isFullBleedRoute
          ? 'h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden'
          : 'min-h-screen min-h-[100dvh]'
      )}
    >
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <Suspense fallback={null}>
        <DebugInspector />
      </Suspense>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-safe">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Personal OS</h1>
          <div className="flex items-center gap-2">
            <WalletWidget />
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Search (Cmd+K)"
            >
              <Command size={20} />
            </button>
            {isAssistantRoute && (
              <button
                onClick={toggleAssistantChats}
                aria-label="Open chats"
                aria-expanded={assistantChatsOpen}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <MessageCircle size={20} />
              </button>
            )}
            <button
              onClick={toggleMainNav}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label={mainNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mainNavOpen}
            >
              {mainNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform lg:translate-x-0 ${
          mainNavOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isResizing ? 'select-none transition-none' : 'transition-transform duration-200 ease-in-out'}`}
        style={{
          width: `${sidebarWidth}px`,
          minWidth: `${getMinWidth()}px`,
          maxWidth: `${getMaxWidth()}px`,
        }}
      >
        <div className="flex flex-col h-full relative max-lg:pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 lg:block hidden touch-none -mr-0.5 pr-0.5 ${
              isResizing ? 'bg-blue-500' : 'hover:bg-blue-400/50'
            }`}
            aria-label="Resize sidebar"
            role="separator"
            aria-orientation="vertical"
          />

          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personal OS</h1>
            <p
              className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate"
              title={user?.email}
            >
              {user?.email?.includes('@') ? user.email : user ? 'Signed in' : ''}
            </p>
            <div className="mt-3 flex justify-center">
              <WalletWidget />
            </div>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full mt-3 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Command size={16} />
              <span className="flex-1 text-left">Quick Search</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              const isExpanded = isNavGroupExpanded(item);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.name}>
                  {hasChildren ? (
                    <div>
                      <div
                        className={`flex items-stretch rounded-lg transition ${
                          isActive
                            ? 'accent-bg-50 dark:bg-green-900/30 accent-text-700 dark:accent-text-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Link
                          to={item.href}
                          onClick={() => {
                            clearRouteCollapseForExpandKey(navExpandKey(item));
                            closeMainNav();
                          }}
                          className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0 rounded-l-lg"
                        >
                          <span className="shrink-0">
                            <Icon size={20} />
                          </span>
                          <span className="flex-1 text-left truncate flex items-center gap-2">
                            {item.name}
                            {item.name === 'Knowledge Vault' && vaultLinkBadge > 0 && (
                              <span
                                className="shrink-0 text-[10px] font-semibold bg-amber-500 text-white rounded-full px-1.5 py-0.5"
                                title="Pending vault–task link suggestions"
                              >
                                {vaultLinkBadge > 99 ? '99+' : vaultLinkBadge}
                              </span>
                            )}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? `Collapse ${item.name} submenu`
                              : `Expand ${item.name} submenu`
                          }
                          className="flex items-center justify-center px-2.5 py-3 rounded-r-lg shrink-0 border-l border-gray-200/80 dark:border-gray-600/80 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                      {isExpanded && item.children && (
                        <div className="ml-3 mt-2 space-y-1.5 border-l border-gray-200/70 pl-3 dark:border-gray-600/60">
                          {renderNavBranch(item.children, 0)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={closeMainNav}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'accent-bg-50 dark:bg-green-900/30 accent-text-700 dark:accent-text-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <LeisureModeToggle />

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition w-full"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {mainNavOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeMainNav}
        />
      )}

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200',
          isFullBleedRoute ? 'h-full overflow-hidden' : 'min-h-[100dvh]'
        )}
        style={{ marginLeft: isLargeScreen ? `${sidebarWidth}px` : '0' }}
      >
        {isFullBleedRoute ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <div
            className={cn(
              'flex h-full w-full min-h-0 min-w-0 flex-1 flex-col px-6 pb-12 lg:px-12',
              isCompactAdminOutlet ? 'pt-12 lg:pt-4' : 'pt-20 lg:pt-8'
            )}
          >
            <BackendStatusBanner
              className={cn(
                '-mx-6 lg:-mx-12 mb-6 shrink-0',
                isCompactAdminOutlet ? '-mt-4 lg:-mt-2' : '-mt-6 lg:-mt-8'
              )}
            />
            <div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminShellProvider>
      <AdminLayoutContent />
    </AdminShellProvider>
  );
}
