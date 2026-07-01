import { lazy } from 'react';

/** Default landing route — keep eager in App.tsx for fastest first paint. */
export { default as DashboardPage } from '@/pages/admin/DashboardPage';

export const ChatbotPage = lazy(() => import('@/pages/admin/ChatbotPage'));
export const ComponentsDemoPage = lazy(() => import('@/pages/admin/ComponentsDemoPage'));
export const ConceptColliderPage = lazy(() => import('@/pages/admin/ConceptColliderPage'));
export const DailyLearningPage = lazy(() => import('@/pages/admin/DailyLearningPage'));
export const InboxPage = lazy(() => import('@/pages/admin/InboxPage'));
export const CheatSheetPage = lazy(() => import('@/pages/admin/CheatSheetPage'));
export const SyntopicPage = lazy(() => import('@/pages/admin/SyntopicPage'));
export const TaskLinksPage = lazy(() => import('@/pages/admin/TaskLinksPage'));
export const FeynmanStudyPage = lazy(() => import('@/pages/admin/FeynmanStudyPage'));
export const CourseDetailPage = lazy(() => import('@/pages/admin/CourseDetailPage'));
export const CourseGeneratorPage = lazy(() => import('@/pages/admin/CourseGeneratorPage'));
export const CoursesPage = lazy(() => import('@/pages/admin/CoursesPage'));
export const FlashcardsPage = lazy(() => import('@/pages/admin/FlashcardsPage'));
export const FocusModePage = lazy(() => import('@/pages/admin/FocusModePage'));
export const GoalsPage = lazy(() => import('@/pages/admin/GoalsPage'));
export const GrowthSystemPage = lazy(() => import('@/pages/admin/GrowthSystemPage'));
export const HabitsPage = lazy(() => import('@/pages/admin/HabitsPage'));
export const HobbyQuestsPage = lazy(() => import('@/pages/admin/HobbyQuestsPage'));
export const KnowledgeVaultPage = lazy(() => import('@/pages/admin/KnowledgeVaultPage'));
export const DocumentDetailPage = lazy(() => import('@/pages/admin/DocumentDetailPage'));
export const LogbookPage = lazy(() => import('@/pages/admin/LogbookPage'));
export const MediaBacklogPage = lazy(() => import('@/pages/admin/MediaBacklogPage'));
export const MetricsPage = lazy(() => import('@/pages/admin/MetricsPage'));
export const ProjectsPage = lazy(() => import('@/pages/admin/ProjectsPage'));
export const RewardsStorePage = lazy(() => import('@/pages/admin/RewardsStorePage'));
export const RewardStudioPage = lazy(() => import('@/pages/admin/RewardStudioPage'));
export const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
export const SkillTreePage = lazy(() => import('@/pages/admin/SkillTreePage'));
export const StudySessionPage = lazy(() => import('@/pages/admin/StudySessionPage'));
export const StudyStatisticsPage = lazy(() => import('@/pages/admin/StudyStatisticsPage'));
export const TasksPage = lazy(() => import('@/pages/admin/TasksPage'));
export const WeeklyReviewPage = lazy(() => import('@/pages/admin/WeeklyReviewPage'));
export const PlannerPage = lazy(() => import('@/pages/admin/PlannerPage'));
export const HealthFitnessOverviewPage = lazy(
  () => import('@/pages/admin/HealthFitnessOverviewPage')
);
export const HealthFitnessNutritionPage = lazy(
  () => import('@/pages/admin/HealthFitnessNutritionPage')
);
export const HealthFitnessWorkoutsPage = lazy(
  () => import('@/pages/admin/HealthFitnessWorkoutsPage')
);
export const HealthFitnessAuraPage = lazy(() => import('@/pages/admin/HealthFitnessAuraPage'));
export const HealthFitnessRewardsPage = lazy(
  () => import('@/pages/admin/HealthFitnessRewardsPage')
);
export const ZenDashboardPage = lazy(() => import('@/pages/admin/ZenDashboardPage'));
export const MarkdownViewerPage = lazy(() => import('@/pages/admin/MarkdownViewerPage'));
export const VoyagerLayout = lazy(() => import('@/pages/admin/voyager/VoyagerLayout'));
export const VoyagerTripsTab = lazy(() => import('@/pages/admin/voyager/VoyagerTripsTab'));
export const VoyagerMilestonesTab = lazy(
  () => import('@/pages/admin/voyager/VoyagerMilestonesTab')
);
export const VoyagerItineraryTab = lazy(() => import('@/pages/admin/voyager/VoyagerItineraryTab'));
export const CareerLayout = lazy(() => import('@/pages/admin/career/CareerLayout'));
export const CareerDevelopmentOverviewPage = lazy(
  () => import('@/pages/admin/career/CareerDevelopmentOverviewPage')
);
export const ResumeBuilderPage = lazy(() => import('@/pages/admin/career/ResumeBuilderPage'));
export const JobSourcesPage = lazy(() => import('@/pages/admin/career/JobSourcesPage'));
export const PersonalBrandingLayout = lazy(
  () => import('@/pages/admin/personal-branding/PersonalBrandingLayout')
);
export const PersonalBrandingOverviewPage = lazy(
  () => import('@/pages/admin/personal-branding/PersonalBrandingOverviewPage')
);
export const BrandIdentityPage = lazy(
  () => import('@/pages/admin/personal-branding/brand-identity/BrandIdentityPage')
);
export const ContentWorkbenchPage = lazy(
  () => import('@/pages/admin/personal-branding/content-workbench/ContentWorkbenchPage')
);
export const ContentPipelinePage = lazy(
  () => import('@/pages/admin/personal-branding/content-pipeline/ContentPipelinePage')
);
export const SignalRadarPage = lazy(
  () => import('@/pages/admin/personal-branding/signal-radar/SignalRadarPage')
);
export const RolodexPage = lazy(
  () => import('@/pages/admin/personal-branding/rolodex/RolodexPage')
);
export const MemoryAuditPage = lazy(() => import('@/pages/admin/MemoryAuditPage'));
export const AssistantSettingsPage = lazy(() => import('@/pages/admin/AssistantSettingsPage'));
export const ProactiveAutomationsPage = lazy(
  () => import('@/pages/admin/ProactiveAutomationsPage')
);
export const ObservabilityPage = lazy(() => import('@/pages/admin/ObservabilityPage'));
export const AssistantSandboxPage = lazy(() => import('@/pages/admin/AssistantSandboxPage'));
export const ToolsOverviewPage = lazy(() => import('@/pages/admin/tools/ToolsOverviewPage'));
export const WorkflowsListPage = lazy(() => import('@/pages/admin/tools/WorkflowsListPage'));
export const WorkflowEditorPage = lazy(() => import('@/pages/admin/tools/WorkflowEditorPage'));
export const CronBuilderPage = lazy(() => import('@/pages/admin/tools/CronBuilderPage'));
export const PostmanPage = lazy(() => import('@/pages/admin/tools/PostmanPage'));
export const WebhooksListPage = lazy(() => import('@/pages/admin/tools/WebhooksListPage'));
export const WebhookDetailPage = lazy(() => import('@/pages/admin/tools/WebhookDetailPage'));
export const WhiteboardsListPage = lazy(() => import('@/pages/admin/tools/WhiteboardsListPage'));
export const WhiteboardPage = lazy(() => import('@/pages/admin/tools/WhiteboardPage'));
export const FormattersPage = lazy(() => import('@/pages/admin/tools/FormattersPage'));
export const JwtPage = lazy(() => import('@/pages/admin/tools/JwtPage'));
export const Base64Page = lazy(() => import('@/pages/admin/tools/Base64Page'));
export const RegexPage = lazy(() => import('@/pages/admin/tools/RegexPage'));
export const DockerPage = lazy(() => import('@/pages/admin/tools/DockerPage'));
export const EslintPage = lazy(() => import('@/pages/admin/tools/EslintPage'));

export const HouseholdHomePage = lazy(() => import('@/pages/sidecar/HouseholdHomePage'));
export const DropzonePage = lazy(() => import('@/pages/sidecar/DropzonePage'));
export const MealsPage = lazy(() => import('@/pages/sidecar/MealsPage'));
export const PetsPage = lazy(() => import('@/pages/sidecar/PetsPage'));
export const SidecarProfilePage = lazy(() => import('@/pages/sidecar/SidecarProfilePage'));
