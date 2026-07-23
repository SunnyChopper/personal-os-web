$ErrorActionPreference = 'Stop'
Set-Location 'c:\Users\thesu\Desktop\Software\Repositories\personal-os\personal-os-web'

function Commit-Group($msg, $paths) {
  foreach ($p in $paths) {
    if (Test-Path $p) { git add $p }
  }
  $status = git diff --cached --name-only
  if (-not $status) { Write-Host "SKIP (empty): $msg"; return }
  git commit -m $msg
  Write-Host "OK: $msg"
}

Commit-Group 'refactor(ui): add overlay portal, empty-state scenes, and dialog drawer tests' @(
  'apps/web/src/lib/overlay-layer.ts',
  'apps/web/src/components/molecules/OverlayPortal.tsx',
  'apps/web/src/components/molecules/Dialog.tsx',
  'apps/web/src/components/molecules/Dialog.test.tsx',
  'apps/web/src/components/molecules/SlideDrawer.tsx',
  'apps/web/src/components/molecules/SlideDrawer.test.tsx',
  'apps/web/src/components/molecules/BottomSheet.tsx',
  'apps/web/src/components/molecules/EmptyState.tsx',
  'apps/web/src/components/molecules/EmptyState.test.tsx',
  'apps/web/src/components/molecules/empty-state',
  '.cursor/rules/empty-states.mdc'
)

Commit-Group 'refactor(ui): polish shared atoms, toasts, and form controls' @(
  'apps/web/src/components/atoms/Button.tsx',
  'apps/web/src/components/atoms/StatusBadge.tsx',
  'apps/web/src/components/atoms/ThemeToggle.tsx',
  'apps/web/src/components/molecules/Toast.tsx',
  'apps/web/src/components/molecules/IconSelect.tsx',
  'apps/web/src/components/molecules/IconSelect.test.tsx',
  'apps/web/src/components/molecules/MarkdownEditor.tsx',
  'apps/web/src/components/molecules/MultiSelectVaultCombobox.tsx',
  'apps/web/src/components/molecules/LayoutSkeletons.tsx'
)

Commit-Group 'feat(websocket): add authenticated client and repurpose job socket' @(
  'apps/web/src/lib/websocket/authenticated-ws-client.ts',
  'apps/web/src/lib/websocket/repurpose-jobs-ws-client.ts',
  'apps/web/src/lib/websocket/assistant-ws-client.ts'
)

Commit-Group 'feat(personal-branding): extend service contracts, query keys, and lib helpers' @(
  'apps/web/src/types/api/personal-branding.dto.ts',
  'apps/web/src/services/personal-branding.service.ts',
  'apps/web/src/services/personal-branding.service.ideation.test.ts',
  'apps/web/src/services/personal-branding.service.radar.test.ts',
  'apps/web/src/lib/react-query/query-keys.ts',
  'apps/web/src/lib/personal-branding',
  'apps/web/src/lib/llm/config/feature-types.ts',
  'apps/web/src/hooks/useEffectivePlatformRules.ts',
  'apps/web/src/hooks/useEffectivePlatformRules.test.tsx',
  'apps/web/src/hooks/useTargetPlatformRulesExpansion.ts',
  'apps/web/src/hooks/useContentImageInjectJob.ts',
  'apps/web/src/hooks/useContentTemplateAiJob.ts',
  'apps/web/src/hooks/useKeywordOptimizationJob.ts',
  'apps/web/src/hooks/personal-branding'
)

Commit-Group 'feat(personal-branding): add shared molecules and organisms' @(
  'apps/web/src/components/molecules/personal-branding',
  'apps/web/src/components/organisms/personal-branding'
)

Commit-Group 'feat(personal-branding): expand brand identity extraction and platform rules' @(
  'apps/web/src/pages/admin/personal-branding/brand-identity',
  'apps/web/src/hooks/usePersonalBrandingBrandIdentity.ts',
  'apps/web/src/hooks/usePersonalBrandingBrandIdentity.test.tsx',
  'apps/web/src/pages/admin/personal-branding/PersonalBrandingPageTemplate.tsx',
  'apps/web/src/pages/admin/personal-branding/personal-branding-ui.ts'
)

Commit-Group 'feat(personal-branding): expand content pipeline, variants, and publish queue' @(
  'apps/web/src/pages/admin/personal-branding/content-pipeline'
)

Commit-Group 'feat(personal-branding): expand content workbench ideation and templates' @(
  'apps/web/src/pages/admin/personal-branding/content-workbench'
)

Commit-Group 'feat(personal-branding): expand rolodex recon feed and interactions board' @(
  'apps/web/src/pages/admin/personal-branding/rolodex',
  'apps/web/src/hooks/useReconFeed.ts',
  'apps/web/src/hooks/useRolodexReplyRuns.ts',
  'apps/web/src/hooks/__tests__/useReconFeed.test.ts'
)

Commit-Group 'feat(personal-branding): expand signal radar trend stream and settings' @(
  'apps/web/src/pages/admin/personal-branding/signal-radar',
  'apps/web/src/hooks/useSignalRadar.ts',
  'apps/web/src/hooks/__tests__/useSignalRadar.test.ts'
)

Commit-Group 'feat(personal-branding): update module layout shells and navigation' @(
  'apps/web/src/pages/admin/personal-branding/PersonalBrandingLayout.tsx',
  'apps/web/src/pages/admin/personal-branding/SubModuleTabShell.tsx'
)

Commit-Group 'refactor(admin): adopt overlay and empty-state patterns in shared admin UI' @(
  'apps/web/src/components/organisms/AIAssistPanel.tsx',
  'apps/web/src/components/organisms/CommandPalette.tsx',
  'apps/web/src/components/organisms/MorningLaunchpad.tsx',
  'apps/web/src/components/organisms/TaskCalendarView.tsx',
  'apps/web/src/components/organisms/TaskEditPanel.tsx',
  'apps/web/src/components/organisms/WeeklyDashboardSettingsDrawer.tsx',
  'apps/web/src/components/organisms/planner',
  'apps/web/src/contexts/KnowledgeVault/KnowledgeVaultProvider.tsx',
  'apps/web/src/services/knowledge-vault/vault-items.service.ts',
  'apps/web/src/types/knowledge-vault.ts'
)

$remaining = git status -u --short
if ($remaining) {
  Write-Host "Remaining files:"
  Write-Host $remaining
  git add -A
  git reset HEAD apps/logs/frontend/app.jsonl 2>$null
  git reset HEAD apps/garden/tsconfig.tsbuildinfo 2>$null
  $cached = git diff --cached --name-only
  if ($cached) {
    git commit -m 'chore: include remaining frontend updates'
    Write-Host 'OK: remaining files'
  }
}

Write-Host 'Commits done.'
git log --oneline -15
