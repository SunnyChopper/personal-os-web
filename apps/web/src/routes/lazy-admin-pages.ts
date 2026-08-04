import { lazyWithRetry } from '@/lib/stale-chunk-reload';

/** Default landing route — keep eager in App.tsx for fastest first paint. */
export { default as DashboardPage } from '@/pages/admin/DashboardPage';

export const ChatbotPage = lazyWithRetry(() => import('@/pages/admin/ChatbotPage'));
export const ComponentsDemoPage = lazyWithRetry(() => import('@/pages/admin/ComponentsDemoPage'));
export const ConceptColliderPage = lazyWithRetry(() => import('@/pages/admin/ConceptColliderPage'));
export const DailyLearningPage = lazyWithRetry(() => import('@/pages/admin/DailyLearningPage'));
export const InboxPage = lazyWithRetry(() => import('@/pages/admin/InboxPage'));
export const CheatSheetPage = lazyWithRetry(() => import('@/pages/admin/CheatSheetPage'));
export const SyntopicPage = lazyWithRetry(() => import('@/pages/admin/SyntopicPage'));
export const ProjectLabsPage = lazyWithRetry(() => import('@/pages/admin/ProjectLabsPage'));
export const TaskLinksPage = lazyWithRetry(() => import('@/pages/admin/TaskLinksPage'));
export const FeynmanStudyPage = lazyWithRetry(() => import('@/pages/admin/FeynmanStudyPage'));
export const CourseDetailPage = lazyWithRetry(() => import('@/pages/admin/CourseDetailPage'));
export const CourseGeneratorPage = lazyWithRetry(() => import('@/pages/admin/CourseGeneratorPage'));
export const CoursesPage = lazyWithRetry(() => import('@/pages/admin/CoursesPage'));
export const FlashcardsPage = lazyWithRetry(() => import('@/pages/admin/FlashcardsPage'));
export const FocusModePage = lazyWithRetry(() => import('@/pages/admin/FocusModePage'));
export const GoalsPage = lazyWithRetry(() => import('@/pages/admin/GoalsPage'));
export const GrowthSystemPage = lazyWithRetry(() => import('@/pages/admin/GrowthSystemPage'));
export const HabitsPage = lazyWithRetry(() => import('@/pages/admin/HabitsPage'));
export const HobbyQuestsPage = lazyWithRetry(() => import('@/pages/admin/HobbyQuestsPage'));
export const KnowledgeVaultPage = lazyWithRetry(() => import('@/pages/admin/KnowledgeVaultPage'));
export const DocumentDetailPage = lazyWithRetry(() => import('@/pages/admin/DocumentDetailPage'));
export const LogbookPage = lazyWithRetry(() => import('@/pages/admin/LogbookPage'));
export const MediaBacklogPage = lazyWithRetry(() => import('@/pages/admin/MediaBacklogPage'));
export const MetricsPage = lazyWithRetry(() => import('@/pages/admin/MetricsPage'));
export const ProjectsPage = lazyWithRetry(() => import('@/pages/admin/ProjectsPage'));
export const RewardsStorePage = lazyWithRetry(() => import('@/pages/admin/RewardsStorePage'));
export const RewardStudioPage = lazyWithRetry(() => import('@/pages/admin/RewardStudioPage'));
export const SettingsPage = lazyWithRetry(() => import('@/pages/admin/SettingsPage'));
export const SkillTreePage = lazyWithRetry(() => import('@/pages/admin/SkillTreePage'));
export const StudySessionPage = lazyWithRetry(() => import('@/pages/admin/StudySessionPage'));
export const StudyStatisticsPage = lazyWithRetry(() => import('@/pages/admin/StudyStatisticsPage'));
export const TasksPage = lazyWithRetry(() => import('@/pages/admin/TasksPage'));
export const WeeklyReviewPage = lazyWithRetry(() => import('@/pages/admin/WeeklyReviewPage'));
export const PlannerPage = lazyWithRetry(() => import('@/pages/admin/PlannerPage'));
export const HealthFitnessOverviewPage = lazyWithRetry(
  () => import('@/pages/admin/HealthFitnessOverviewPage')
);
export const HealthFitnessNutritionPage = lazyWithRetry(
  () => import('@/pages/admin/HealthFitnessNutritionPage')
);
export const HealthFitnessWorkoutsPage = lazyWithRetry(
  () => import('@/pages/admin/HealthFitnessWorkoutsPage')
);
export const HealthFitnessAuraPage = lazyWithRetry(() => import('@/pages/admin/HealthFitnessAuraPage'));
export const HealthFitnessRewardsPage = lazyWithRetry(
  () => import('@/pages/admin/HealthFitnessRewardsPage')
);
export const ZenDashboardPage = lazyWithRetry(() => import('@/pages/admin/ZenDashboardPage'));
export const MarkdownViewerPage = lazyWithRetry(() => import('@/pages/admin/MarkdownViewerPage'));
export const VoyagerLayout = lazyWithRetry(() => import('@/pages/admin/voyager/VoyagerLayout'));
export const VoyagerTripsTab = lazyWithRetry(() => import('@/pages/admin/voyager/VoyagerTripsTab'));
export const VoyagerMilestonesTab = lazyWithRetry(
  () => import('@/pages/admin/voyager/VoyagerMilestonesTab')
);
export const VoyagerItineraryTab = lazyWithRetry(() => import('@/pages/admin/voyager/VoyagerItineraryTab'));
export const CareerLayout = lazyWithRetry(() => import('@/pages/admin/career/CareerLayout'));
export const CareerDevelopmentOverviewPage = lazyWithRetry(
  () => import('@/pages/admin/career/CareerDevelopmentOverviewPage')
);
export const ResumeBuilderPage = lazyWithRetry(() => import('@/pages/admin/career/ResumeBuilderPage'));
export const JobSourcesPage = lazyWithRetry(() => import('@/pages/admin/career/JobSourcesPage'));
export const PersonalBrandingLayout = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/PersonalBrandingLayout')
);
export const PersonalBrandingOverviewPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/PersonalBrandingOverviewPage')
);
export const BrandIdentityPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/brand-identity/BrandIdentityPage')
);
export const ContentWorkbenchPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/content-workbench/ContentWorkbenchPage')
);
export const ContentPipelinePage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/content-pipeline/ContentPipelinePage')
);
export const SignalRadarPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/signal-radar/SignalRadarPage')
);
export const ContentStreamPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/content-stream/ContentStreamPage')
);
export const RolodexPage = lazyWithRetry(
  () => import('@/pages/admin/personal-branding/rolodex/RolodexPage')
);
export const MemoryAuditPage = lazyWithRetry(() => import('@/pages/admin/MemoryAuditPage'));
export const AssistantSettingsPage = lazyWithRetry(() => import('@/pages/admin/AssistantSettingsPage'));
export const ProactiveAutomationsPage = lazyWithRetry(
  () => import('@/pages/admin/ProactiveAutomationsPage')
);
export const InterventionsPage = lazyWithRetry(() => import('@/pages/admin/InterventionsPage'));
export const ObservabilityPage = lazyWithRetry(() => import('@/pages/admin/ObservabilityPage'));
export const AssistantSandboxPage = lazyWithRetry(() => import('@/pages/admin/AssistantSandboxPage'));
export const ToolsOverviewPage = lazyWithRetry(() => import('@/pages/admin/tools/ToolsOverviewPage'));
export const WorkflowsListPage = lazyWithRetry(() => import('@/pages/admin/tools/WorkflowsListPage'));
export const WorkflowEditorPage = lazyWithRetry(() => import('@/pages/admin/tools/WorkflowEditorPage'));
export const CronBuilderPage = lazyWithRetry(() => import('@/pages/admin/tools/CronBuilderPage'));
export const PostmanPage = lazyWithRetry(() => import('@/pages/admin/tools/PostmanPage'));
export const WebhooksListPage = lazyWithRetry(() => import('@/pages/admin/tools/WebhooksListPage'));
export const WebhookDetailPage = lazyWithRetry(() => import('@/pages/admin/tools/WebhookDetailPage'));
export const WhiteboardsListPage = lazyWithRetry(() => import('@/pages/admin/tools/WhiteboardsListPage'));
export const WhiteboardPage = lazyWithRetry(() => import('@/pages/admin/tools/WhiteboardPage'));
export const FormattersPage = lazyWithRetry(() => import('@/pages/admin/tools/FormattersPage'));
export const JwtPage = lazyWithRetry(() => import('@/pages/admin/tools/JwtPage'));
export const Base64Page = lazyWithRetry(() => import('@/pages/admin/tools/Base64Page'));
export const RegexPage = lazyWithRetry(() => import('@/pages/admin/tools/RegexPage'));
export const DockerPage = lazyWithRetry(() => import('@/pages/admin/tools/DockerPage'));
export const EslintPage = lazyWithRetry(() => import('@/pages/admin/tools/EslintPage'));

export const HouseholdHomePage = lazyWithRetry(() => import('@/pages/sidecar/HouseholdHomePage'));
export const DropzonePage = lazyWithRetry(() => import('@/pages/sidecar/DropzonePage'));
export const MealsPage = lazyWithRetry(() => import('@/pages/sidecar/MealsPage'));
export const PetsPage = lazyWithRetry(() => import('@/pages/sidecar/PetsPage'));
export const SidecarProfilePage = lazyWithRetry(() => import('@/pages/sidecar/SidecarProfilePage'));
