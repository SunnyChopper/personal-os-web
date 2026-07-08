import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { ProtectedRoute } from './components/templates/auth/ProtectedRoute';
import { RoleRoute } from './components/templates/auth/RoleRoute';
import LeisureOnlyRoute from './components/templates/routing/LeisureOnlyRoute';
import StartupLoader from './components/molecules/StartupLoader';
import AdminShellSkeleton from './components/templates/AdminShellSkeleton';
import { AdminRouteSuspense } from './components/molecules/AdminRouteSuspense';
import DashboardRedirect from './components/templates/routing/DashboardRedirect';
import ErrorBoundary from './components/templates/shared/ErrorBoundary';
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
import LoginPage from './pages/admin/LoginPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ProductsPage from './pages/ProductsPage';
import { authService } from './lib/auth/auth.service';
import { markStartup } from './lib/startup/startup-telemetry';
import {
  AssistantSandboxPage,
  AssistantSettingsPage,
  Base64Page,
  BrandIdentityPage,
  CareerDevelopmentOverviewPage,
  CareerLayout,
  ChatbotPage,
  CheatSheetPage,
  ComponentsDemoPage,
  ConceptColliderPage,
  ContentPipelinePage,
  ContentWorkbenchPage,
  CourseDetailPage,
  CourseGeneratorPage,
  CoursesPage,
  CronBuilderPage,
  DailyLearningPage,
  DashboardPage,
  DockerPage,
  DocumentDetailPage,
  DropzonePage,
  EslintPage,
  FeynmanStudyPage,
  FlashcardsPage,
  FocusModePage,
  FormattersPage,
  GoalsPage,
  GrowthSystemPage,
  HabitsPage,
  HealthFitnessAuraPage,
  HealthFitnessNutritionPage,
  HealthFitnessOverviewPage,
  HealthFitnessRewardsPage,
  HealthFitnessWorkoutsPage,
  HobbyQuestsPage,
  HouseholdHomePage,
  InboxPage,
  JobSourcesPage,
  JwtPage,
  KnowledgeVaultPage,
  LogbookPage,
  MarkdownViewerPage,
  MediaBacklogPage,
  MemoryAuditPage,
  MetricsPage,
  ObservabilityPage,
  PersonalBrandingLayout,
  PersonalBrandingOverviewPage,
  PetsPage,
  PlannerPage,
  PostmanPage,
  ProactiveAutomationsPage,
  ProjectsPage,
  ProjectLabsPage,
  RegexPage,
  ResumeBuilderPage,
  RewardStudioPage,
  RewardsStorePage,
  RolodexPage,
  SettingsPage,
  SidecarProfilePage,
  SignalRadarPage,
  SkillTreePage,
  StudySessionPage,
  StudyStatisticsPage,
  SyntopicPage,
  TaskLinksPage,
  TasksPage,
  ToolsOverviewPage,
  VoyagerItineraryTab,
  VoyagerLayout,
  VoyagerMilestonesTab,
  VoyagerTripsTab,
  WebhookDetailPage,
  WebhooksListPage,
  WeeklyReviewPage,
  WhiteboardPage,
  WhiteboardsListPage,
  WorkflowEditorPage,
  WorkflowsListPage,
  ZenDashboardPage,
  MealsPage,
} from './routes/lazy-admin-pages';
import { ADMIN_CHILD_ROUTES, ROUTES } from './routes';

function AppContent() {
  usePageTracking();
  useThemeInitializer();
  const navigate = useNavigate();

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
                <AdminRouteSuspense>
                  <FocusModePage />
                </AdminRouteSuspense>
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
          <Route
            path="home"
            element={
              <AdminRouteSuspense>
                <HouseholdHomePage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="dropzone"
            element={
              <AdminRouteSuspense>
                <DropzonePage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="meals"
            element={
              <AdminRouteSuspense>
                <MealsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="pets"
            element={
              <AdminRouteSuspense>
                <PetsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="profile"
            element={
              <AdminRouteSuspense>
                <SidecarProfilePage />
              </AdminRouteSuspense>
            }
          />
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
          <Route
            path={ADMIN_CHILD_ROUTES.zenDashboard}
            element={
              <AdminRouteSuspense>
                <ZenDashboardPage />
              </AdminRouteSuspense>
            }
          />
          <Route path={ADMIN_CHILD_ROUTES.voyager} element={<LeisureOnlyRoute />}>
            <Route
              element={
                <AdminRouteSuspense>
                  <VoyagerLayout />
                </AdminRouteSuspense>
              }
            >
              <Route index element={<Navigate to="trips" replace />} />
              <Route
                path="trips"
                element={
                  <AdminRouteSuspense>
                    <VoyagerTripsTab />
                  </AdminRouteSuspense>
                }
              />
              <Route
                path="milestones"
                element={
                  <AdminRouteSuspense>
                    <VoyagerMilestonesTab />
                  </AdminRouteSuspense>
                }
              />
              <Route
                path="itinerary"
                element={
                  <AdminRouteSuspense>
                    <VoyagerItineraryTab />
                  </AdminRouteSuspense>
                }
              />
            </Route>
          </Route>
          <Route
            path={ADMIN_CHILD_ROUTES.career}
            element={
              <AdminRouteSuspense>
                <CareerLayout />
              </AdminRouteSuspense>
            }
          >
            <Route
              index
              element={
                <AdminRouteSuspense>
                  <CareerDevelopmentOverviewPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="resume"
              element={
                <AdminRouteSuspense>
                  <ResumeBuilderPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="job-sources"
              element={
                <AdminRouteSuspense>
                  <JobSourcesPage />
                </AdminRouteSuspense>
              }
            />
          </Route>
          <Route
            path={ADMIN_CHILD_ROUTES.personalBranding}
            element={
              <AdminRouteSuspense>
                <PersonalBrandingLayout />
              </AdminRouteSuspense>
            }
          >
            <Route
              index
              element={
                <AdminRouteSuspense>
                  <PersonalBrandingOverviewPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="brand-identity"
              element={
                <AdminRouteSuspense>
                  <BrandIdentityPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="workbench"
              element={
                <AdminRouteSuspense>
                  <ContentWorkbenchPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="pipeline"
              element={
                <AdminRouteSuspense>
                  <ContentPipelinePage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="radar"
              element={
                <AdminRouteSuspense>
                  <SignalRadarPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path="rolodex"
              element={
                <AdminRouteSuspense>
                  <RolodexPage />
                </AdminRouteSuspense>
              }
            />
          </Route>
          <Route
            path={ADMIN_CHILD_ROUTES.growthSystem}
            element={
              <AdminRouteSuspense>
                <GrowthSystemPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.tasks}
            element={
              <AdminRouteSuspense>
                <TasksPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.habits}
            element={
              <AdminRouteSuspense>
                <HabitsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.metrics}
            element={
              <AdminRouteSuspense>
                <MetricsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.goals}
            element={
              <AdminRouteSuspense>
                <GoalsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.projects}
            element={
              <AdminRouteSuspense>
                <ProjectsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.logbook}
            element={
              <AdminRouteSuspense>
                <LogbookPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.weeklyReview}
            element={
              <AdminRouteSuspense>
                <WeeklyReviewPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.plannerWeek}
            element={
              <AdminRouteSuspense>
                <PlannerPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.planner}
            element={
              <AdminRouteSuspense>
                <PlannerPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.plannerNightly}
            element={<Navigate to={ROUTES.admin.planner} replace />}
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitness}
            element={
              <AdminRouteSuspense>
                <HealthFitnessOverviewPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessNutrition}
            element={
              <AdminRouteSuspense>
                <HealthFitnessNutritionPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessWorkouts}
            element={
              <AdminRouteSuspense>
                <HealthFitnessWorkoutsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessAura}
            element={
              <AdminRouteSuspense>
                <HealthFitnessAuraPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.healthFitnessRewards}
            element={
              <AdminRouteSuspense>
                <HealthFitnessRewardsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistant}
            element={
              <AdminRouteSuspense>
                <ChatbotPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantToolSafety}
            element={
              <AdminRouteSuspense>
                <AssistantSettingsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantProactive}
            element={
              <AdminRouteSuspense>
                <ProactiveAutomationsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantObservability}
            element={
              <AdminRouteSuspense>
                <ObservabilityPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.assistantSandbox}
            element={
              <AdminRouteSuspense>
                <AssistantSandboxPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={`${ADMIN_CHILD_ROUTES.assistant}/:threadId`}
            element={
              <AdminRouteSuspense>
                <ChatbotPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.memoryAudit}
            element={
              <AdminRouteSuspense>
                <MemoryAuditPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.componentsDemo}
            element={
              <AdminRouteSuspense>
                <ComponentsDemoPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.settings}
            element={
              <AdminRouteSuspense>
                <SettingsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.mediaBacklog}
            element={
              <AdminRouteSuspense>
                <MediaBacklogPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.hobbyQuests}
            element={
              <AdminRouteSuspense>
                <HobbyQuestsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.rewardsStore}
            element={
              <AdminRouteSuspense>
                <RewardsStorePage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.rewardStudio}
            element={
              <AdminRouteSuspense>
                <RewardStudioPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVault}
            element={
              <AdminRouteSuspense>
                <KnowledgeVaultPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultLibrary}
            element={
              <AdminRouteSuspense>
                <KnowledgeVaultPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultDocument}
            element={
              <AdminRouteSuspense>
                <DocumentDetailPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultCourses}
            element={
              <AdminRouteSuspense>
                <CoursesPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="knowledge-vault/courses/new"
            element={
              <AdminRouteSuspense>
                <CourseGeneratorPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="knowledge-vault/courses/:courseId"
            element={
              <AdminRouteSuspense>
                <CourseDetailPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="knowledge-vault/courses/:courseId/:lessonId"
            element={
              <AdminRouteSuspense>
                <CourseDetailPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultSkillTree}
            element={
              <AdminRouteSuspense>
                <SkillTreePage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultFlashcards}
            element={
              <AdminRouteSuspense>
                <FlashcardsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultCollider}
            element={
              <AdminRouteSuspense>
                <ConceptColliderPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultInbox}
            element={
              <AdminRouteSuspense>
                <InboxPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultCheatSheet}
            element={
              <AdminRouteSuspense>
                <CheatSheetPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultSyntopic}
            element={
              <AdminRouteSuspense>
                <SyntopicPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultProjectLabs}
            element={
              <AdminRouteSuspense>
                <ProjectLabsPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultTaskLinks}
            element={
              <AdminRouteSuspense>
                <TaskLinksPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.knowledgeVaultDailyLearning}
            element={
              <AdminRouteSuspense>
                <DailyLearningPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={`${ADMIN_CHILD_ROUTES.knowledgeVaultFeynmanStudy}/:itemId`}
            element={
              <AdminRouteSuspense>
                <FeynmanStudyPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="knowledge-vault/study"
            element={
              <AdminRouteSuspense>
                <StudySessionPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path="knowledge-vault/statistics"
            element={
              <AdminRouteSuspense>
                <StudyStatisticsPage />
              </AdminRouteSuspense>
            }
          />
          <Route path="tools">
            <Route
              index
              element={
                <AdminRouteSuspense>
                  <ToolsOverviewPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWorkflows}
              element={
                <AdminRouteSuspense>
                  <WorkflowsListPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWorkflowEditor}
              element={
                <AdminRouteSuspense>
                  <WorkflowEditorPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsCronBuilder}
              element={
                <AdminRouteSuspense>
                  <CronBuilderPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsPostman}
              element={
                <AdminRouteSuspense>
                  <PostmanPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWebhooks}
              element={
                <AdminRouteSuspense>
                  <WebhooksListPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWebhookDetail}
              element={
                <AdminRouteSuspense>
                  <WebhookDetailPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWhiteboardFile}
              element={
                <AdminRouteSuspense>
                  <WhiteboardPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsWhiteboard}
              element={
                <AdminRouteSuspense>
                  <WhiteboardsListPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsFormatters}
              element={
                <AdminRouteSuspense>
                  <FormattersPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsJwt}
              element={
                <AdminRouteSuspense>
                  <JwtPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsBase64}
              element={
                <AdminRouteSuspense>
                  <Base64Page />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsRegex}
              element={
                <AdminRouteSuspense>
                  <RegexPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsDocker}
              element={
                <AdminRouteSuspense>
                  <DockerPage />
                </AdminRouteSuspense>
              }
            />
            <Route
              path={ADMIN_CHILD_ROUTES.toolsEslint}
              element={
                <AdminRouteSuspense>
                  <EslintPage />
                </AdminRouteSuspense>
              }
            />
          </Route>
          <Route
            path={ADMIN_CHILD_ROUTES.markdownViewer}
            element={
              <AdminRouteSuspense>
                <MarkdownViewerPage />
              </AdminRouteSuspense>
            }
          />
          <Route
            path={ADMIN_CHILD_ROUTES.markdownViewerFile}
            element={
              <AdminRouteSuspense>
                <MarkdownViewerPage />
              </AdminRouteSuspense>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function AppInitializer() {
  const { loading: authLoading } = useAuth();
  const hasStoredSession = authService.isAuthenticated();
  const showStartupLoader = authLoading && !hasStoredSession;
  const showShellSkeleton = authLoading && hasStoredSession;

  useEffect(() => {
    if (!authLoading) {
      markStartup('app_shell_visible');
    }
  }, [authLoading]);

  return (
    <>
      <StartupLoader isLoading={showStartupLoader} />
      {showShellSkeleton ? <AdminShellSkeleton /> : null}
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
