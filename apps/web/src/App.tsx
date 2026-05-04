import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import LeisureOnlyRoute from './components/routing/LeisureOnlyRoute';
import Loader from './components/molecules/Loader';
import DashboardRedirect from './components/routing/DashboardRedirect';
import ErrorBoundary from './components/shared/ErrorBoundary';
import AdminLayout from './components/templates/AdminLayout';
import SidecarLayout from './components/templates/SidecarLayout';
import MainLayout from './components/templates/MainLayout';
import { KnowledgeVaultProvider } from './contexts/KnowledgeVault';
import { ModeProvider } from './contexts/Mode';
import { WalletProvider } from './contexts/Wallet';
import { RewardsProvider } from './contexts/Rewards';
import { useAuth } from './contexts/Auth';
import { usePageTracking } from './hooks/usePageTracking';
import { useThemeInitializer } from './hooks/useTheme';
import ChatbotPage from './pages/admin/ChatbotPage';
import ComponentsDemoPage from './pages/admin/ComponentsDemoPage';
import ConceptColliderPage from './pages/admin/ConceptColliderPage';
import DailyLearningPage from './pages/admin/DailyLearningPage';
import InboxPage from './pages/admin/InboxPage';
import CheatSheetPage from './pages/admin/CheatSheetPage';
import SyntopicPage from './pages/admin/SyntopicPage';
import TaskLinksPage from './pages/admin/TaskLinksPage';
import FeynmanStudyPage from './pages/admin/FeynmanStudyPage';
import CourseDetailPage from './pages/admin/CourseDetailPage';
import CourseGeneratorPage from './pages/admin/CourseGeneratorPage';
import CoursesPage from './pages/admin/CoursesPage';
import DashboardPage from './pages/admin/DashboardPage';
import FlashcardsPage from './pages/admin/FlashcardsPage';
import FocusModePage from './pages/admin/FocusModePage';
import GoalsPage from './pages/admin/GoalsPage';
import GrowthSystemPage from './pages/admin/GrowthSystemPage';
import HabitsPage from './pages/admin/HabitsPage';
import HobbyQuestsPage from './pages/admin/HobbyQuestsPage';
import KnowledgeVaultPage from './pages/admin/KnowledgeVaultPage';
import LogbookPage from './pages/admin/LogbookPage';
import LoginPage from './pages/admin/LoginPage';
import MediaBacklogPage from './pages/admin/MediaBacklogPage';
import MetricsPage from './pages/admin/MetricsPage';
import ProjectsPage from './pages/admin/ProjectsPage';
import RewardsStorePage from './pages/admin/RewardsStorePage';
import RewardStudioPage from './pages/admin/RewardStudioPage';
import SettingsPage from './pages/admin/SettingsPage';
import SkillTreePage from './pages/admin/SkillTreePage';
import StudySessionPage from './pages/admin/StudySessionPage';
import StudyStatisticsPage from './pages/admin/StudyStatisticsPage';
import TasksPage from './pages/admin/TasksPage';
import WeeklyReviewPage from './pages/admin/WeeklyReviewPage';
import PlannerPage from './pages/admin/PlannerPage';
import HealthFitnessOverviewPage from './pages/admin/HealthFitnessOverviewPage';
import HealthFitnessNutritionPage from './pages/admin/HealthFitnessNutritionPage';
import HealthFitnessWorkoutsPage from './pages/admin/HealthFitnessWorkoutsPage';
import HealthFitnessAuraPage from './pages/admin/HealthFitnessAuraPage';
import ZenDashboardPage from './pages/admin/ZenDashboardPage';
import MarkdownViewerPage from './pages/admin/MarkdownViewerPage';
import VoyagerLayout from './pages/admin/voyager/VoyagerLayout';
import VoyagerTripsTab from './pages/admin/voyager/VoyagerTripsTab';
import VoyagerMilestonesTab from './pages/admin/voyager/VoyagerMilestonesTab';
import VoyagerItineraryTab from './pages/admin/voyager/VoyagerItineraryTab';
import CareerLayout from './pages/admin/career/CareerLayout';
import CareerDevelopmentOverviewPage from './pages/admin/career/CareerDevelopmentOverviewPage';
import ResumeBuilderPage from './pages/admin/career/ResumeBuilderPage';
import MemoryAuditPage from './pages/admin/MemoryAuditPage';
import AssistantSettingsPage from './pages/admin/AssistantSettingsPage';
import ProactiveAutomationsPage from './pages/admin/ProactiveAutomationsPage';
import ObservabilityPage from './pages/admin/ObservabilityPage';
import ToolsSkeleton from './components/molecules/ToolsSkeleton';
import ToolsOverviewPage from './pages/admin/tools/ToolsOverviewPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ProductsPage from './pages/ProductsPage';
import HouseholdHomePage from './pages/sidecar/HouseholdHomePage';
import DropzonePage from './pages/sidecar/DropzonePage';
import MealsPage from './pages/sidecar/MealsPage';
import PetsPage from './pages/sidecar/PetsPage';
import SidecarProfilePage from './pages/sidecar/SidecarProfilePage';
import { ADMIN_CHILD_ROUTES, ROUTES } from './routes';

const WorkflowsListPage = lazy(() => import('./pages/admin/tools/WorkflowsListPage'));
const WorkflowEditorPage = lazy(() => import('./pages/admin/tools/WorkflowEditorPage'));
const CronBuilderPage = lazy(() => import('./pages/admin/tools/CronBuilderPage'));
const PostmanPage = lazy(() => import('./pages/admin/tools/PostmanPage'));
const WebhooksListPage = lazy(() => import('./pages/admin/tools/WebhooksListPage'));
const WebhookDetailPage = lazy(() => import('./pages/admin/tools/WebhookDetailPage'));
const WhiteboardsListPage = lazy(() => import('./pages/admin/tools/WhiteboardsListPage'));
const WhiteboardPage = lazy(() => import('./pages/admin/tools/WhiteboardPage'));
const FormattersPage = lazy(() => import('./pages/admin/tools/FormattersPage'));
const JwtPage = lazy(() => import('./pages/admin/tools/JwtPage'));
const Base64Page = lazy(() => import('./pages/admin/tools/Base64Page'));
const RegexPage = lazy(() => import('./pages/admin/tools/RegexPage'));
const DockerPage = lazy(() => import('./pages/admin/tools/DockerPage'));
const EslintPage = lazy(() => import('./pages/admin/tools/EslintPage'));

function ToolSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<ToolsSkeleton />}>{children}</Suspense>;
}

function AppContent() {
  usePageTracking();
  useThemeInitializer();
  const navigate = useNavigate();

  // Handle GitHub Pages 404 redirect
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.products} element={<ProductsPage />} />
        </Route>

        <Route path={ROUTES.admin.login} element={<LoginPage />} />

        <Route
          path={ROUTES.admin.focus}
          element={
            <ProtectedRoute>
              <RoleRoute allowRole="owner" redirectTo={ROUTES.sidecar.home}>
                <FocusModePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.sidecar.base}
          element={
            <ProtectedRoute>
              <RoleRoute allowRole="spouse" redirectTo={ROUTES.admin.dashboard}>
                <SidecarLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HouseholdHomePage />} />
          <Route path="dropzone" element={<DropzonePage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="profile" element={<SidecarProfilePage />} />
        </Route>

        <Route
          path={ROUTES.admin.base}
          element={
            <ProtectedRoute>
              <RoleRoute allowRole="owner" redirectTo={ROUTES.sidecar.home}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRedirect />} />
          <Route path={ADMIN_CHILD_ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ADMIN_CHILD_ROUTES.zenDashboard} element={<ZenDashboardPage />} />
          <Route path={ADMIN_CHILD_ROUTES.voyager} element={<LeisureOnlyRoute />}>
            <Route element={<VoyagerLayout />}>
              <Route index element={<Navigate to="trips" replace />} />
              <Route path="trips" element={<VoyagerTripsTab />} />
              <Route path="milestones" element={<VoyagerMilestonesTab />} />
              <Route path="itinerary" element={<VoyagerItineraryTab />} />
            </Route>
          </Route>
          <Route path={ADMIN_CHILD_ROUTES.career} element={<CareerLayout />}>
            <Route index element={<CareerDevelopmentOverviewPage />} />
            <Route path="resume" element={<ResumeBuilderPage />} />
          </Route>
          <Route path={ADMIN_CHILD_ROUTES.growthSystem} element={<GrowthSystemPage />} />
          <Route path={ADMIN_CHILD_ROUTES.tasks} element={<TasksPage />} />
          <Route path={ADMIN_CHILD_ROUTES.habits} element={<HabitsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.metrics} element={<MetricsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.goals} element={<GoalsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.projects} element={<ProjectsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.logbook} element={<LogbookPage />} />
          <Route path={ADMIN_CHILD_ROUTES.weeklyReview} element={<WeeklyReviewPage />} />
          <Route path={ADMIN_CHILD_ROUTES.planner} element={<PlannerPage />} />
          <Route
            path={ADMIN_CHILD_ROUTES.plannerNightly}
            element={<Navigate to={ROUTES.admin.planner} replace />}
          />
          <Route path={ADMIN_CHILD_ROUTES.healthFitness} element={<HealthFitnessOverviewPage />} />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessNutrition}
            element={<HealthFitnessNutritionPage />}
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessWorkouts}
            element={<HealthFitnessWorkoutsPage />}
          />
          <Route path={ADMIN_CHILD_ROUTES.healthFitnessAura} element={<HealthFitnessAuraPage />} />
          <Route path={ADMIN_CHILD_ROUTES.assistant} element={<ChatbotPage />} />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantToolSafety}
            element={<AssistantSettingsPage />}
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantProactive}
            element={<ProactiveAutomationsPage />}
          />
          <Route path={ADMIN_CHILD_ROUTES.assistantObservability} element={<ObservabilityPage />} />
          <Route path={`${ADMIN_CHILD_ROUTES.assistant}/:threadId`} element={<ChatbotPage />} />
          <Route path={ADMIN_CHILD_ROUTES.memoryAudit} element={<MemoryAuditPage />} />
          <Route path={ADMIN_CHILD_ROUTES.componentsDemo} element={<ComponentsDemoPage />} />
          <Route path={ADMIN_CHILD_ROUTES.settings} element={<SettingsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.mediaBacklog} element={<MediaBacklogPage />} />
          <Route path={ADMIN_CHILD_ROUTES.hobbyQuests} element={<HobbyQuestsPage />} />
          <Route path={ADMIN_CHILD_ROUTES.rewardsStore} element={<RewardsStorePage />} />
          <Route path={ADMIN_CHILD_ROUTES.rewardStudio} element={<RewardStudioPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVault} element={<KnowledgeVaultPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultLibrary} element={<KnowledgeVaultPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultCourses} element={<CoursesPage />} />
          <Route path="knowledge-vault/courses/new" element={<CourseGeneratorPage />} />
          <Route path="knowledge-vault/courses/:courseId" element={<CourseDetailPage />} />
          <Route
            path="knowledge-vault/courses/:courseId/:lessonId"
            element={<CourseDetailPage />}
          />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultSkillTree} element={<SkillTreePage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultFlashcards} element={<FlashcardsPage />} />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultCollider}
            element={<ConceptColliderPage />}
          />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultInbox} element={<InboxPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultCheatSheet} element={<CheatSheetPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultSyntopic} element={<SyntopicPage />} />
          <Route path={ADMIN_CHILD_ROUTES.knowledgeVaultTaskLinks} element={<TaskLinksPage />} />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultDailyLearning}
            element={<DailyLearningPage />}
          />
          <Route
            path={`${ADMIN_CHILD_ROUTES.knowledgeVaultFeynmanStudy}/:itemId`}
            element={<FeynmanStudyPage />}
          />
          <Route path="knowledge-vault/study" element={<StudySessionPage />} />
          <Route path="knowledge-vault/statistics" element={<StudyStatisticsPage />} />
          <Route path="tools">
            <Route index element={<ToolsOverviewPage />} />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWorkflows}
              element={
                <ToolSuspense>
                  <WorkflowsListPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWorkflowEditor}
              element={
                <ToolSuspense>
                  <WorkflowEditorPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsCronBuilder}
              element={
                <ToolSuspense>
                  <CronBuilderPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsPostman}
              element={
                <ToolSuspense>
                  <PostmanPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWebhooks}
              element={
                <ToolSuspense>
                  <WebhooksListPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWebhookDetail}
              element={
                <ToolSuspense>
                  <WebhookDetailPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWhiteboardFile}
              element={
                <ToolSuspense>
                  <WhiteboardPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWhiteboard}
              element={
                <ToolSuspense>
                  <WhiteboardsListPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsFormatters}
              element={
                <ToolSuspense>
                  <FormattersPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsJwt}
              element={
                <ToolSuspense>
                  <JwtPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsBase64}
              element={
                <ToolSuspense>
                  <Base64Page />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsRegex}
              element={
                <ToolSuspense>
                  <RegexPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsDocker}
              element={
                <ToolSuspense>
                  <DockerPage />
                </ToolSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsEslint}
              element={
                <ToolSuspense>
                  <EslintPage />
                </ToolSuspense>
              }
            />
          </Route>
          <Route path={ADMIN_CHILD_ROUTES.markdownViewer} element={<MarkdownViewerPage />} />
          <Route path={ADMIN_CHILD_ROUTES.markdownViewerFile} element={<MarkdownViewerPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function AppInitializer() {
  const { loading: authLoading } = useAuth();
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = useState(false);

  // Ensure loader shows for at least 800ms to be clearly visible
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinDisplayTimeElapsed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Show loader while auth is loading OR until minimum time has passed
  const isLoading = authLoading || !minDisplayTimeElapsed;

  return (
    <>
      <Loader isLoading={isLoading} />
      <ModeProvider>
        <BrowserRouter>
          <WalletProvider>
            <RewardsProvider>
              <KnowledgeVaultProvider>
                <AppContent />
              </KnowledgeVaultProvider>
            </RewardsProvider>
          </WalletProvider>
        </BrowserRouter>
      </ModeProvider>
    </>
  );
}

function App() {
  return <AppInitializer />;
}

export default App;
