import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrandProfile } from '@/types/api/personal-branding.dto';
import { ROUTES } from '@/routes';
import TrendIdeasTab from './TrendIdeasTab';
import VaultExtractorTab from './VaultExtractorTab';
import IdeationEngineTab from './IdeationEngineTab';
import ContentLibraryPanel from './ContentLibraryPanel';
import { VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID } from './content-workbench-helpers';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/useTerminalJobFailureAlert', () => ({
  useTerminalJobFailureAlert: vi.fn(),
}));

vi.mock('@/services/knowledge-vault/vault-items.service', () => ({
  vaultItemsService: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    search: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

vi.mock('@/components/molecules/assistant/BrainstormModelPicker', () => ({
  BrainstormModelPicker: () => <div data-testid="brainstorm-model-picker" />,
}));

vi.mock('@/components/molecules/personal-branding/ContentIdeaCardSkeleton', () => ({
  ContentIdeaGridSkeleton: () => <div data-testid="idea-grid-skeleton" />,
}));

const readyProfile: BrandProfile = {
  id: 'profile-1',
  name: 'Core brand',
  pillars: ['Leadership'],
  targetAudience: 'Founders',
  toneMetrics: {},
  bannedPhrases: [],
  status: 'active',
  userId: 'user-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function renderTrend(overrides: Partial<ComponentProps<typeof TrendIdeasTab>> = {}) {
  return render(
    <MemoryRouter>
      <TrendIdeasTab
        ideas={[]}
        isLoading={false}
        approvingId={null}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onOpenDraft={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>
  );
}

function renderVault(overrides: Partial<ComponentProps<typeof VaultExtractorTab>> = {}) {
  const {
    vaultEnableImageSearch = false,
    onVaultEnableImageSearchChange = vi.fn(),
    ...rest
  } = overrides;
  return render(
    <MemoryRouter>
      <VaultExtractorTab
        ideas={[]}
        isLoading={false}
        approvingId={null}
        profiles={[readyProfile]}
        profilesLoading={false}
        selectedProfileId="profile-1"
        onProfileChange={vi.fn()}
        targetPlatform="linkedin"
        onTargetPlatformChange={vi.fn()}
        selectedVaultItemIds={[]}
        onVaultSelectionChange={vi.fn()}
        vaultEnableImageSearch={vaultEnableImageSearch}
        onVaultEnableImageSearchChange={onVaultEnableImageSearchChange}
        vaultItemLabels={{}}
        onVaultItemLabelsChange={vi.fn()}
        isGenerating={false}
        generateError={null}
        lastGenerationStats={null}
        onGenerate={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        {...rest}
      />
    </MemoryRouter>
  );
}

function renderIdeation(overrides: Partial<ComponentProps<typeof IdeationEngineTab>> = {}) {
  return render(
    <MemoryRouter>
      <IdeationEngineTab
        ideas={[]}
        isLoading={false}
        approvingId={null}
        profiles={[readyProfile]}
        profilesLoading={false}
        selectedProfileId="profile-1"
        onProfileChange={vi.fn()}
        targetPlatform="linkedin"
        onTargetPlatformChange={vi.fn()}
        seedIdeas=""
        onSeedIdeasChange={vi.fn()}
        boostFromRecentPublishes={true}
        onBoostFromRecentPublishesChange={vi.fn()}
        enableImageSearch={false}
        onEnableImageSearchChange={vi.fn()}
        enableKeywordResearch={false}
        onEnableKeywordResearchChange={vi.fn()}
        ideaCount={6}
        onIdeaCountChange={vi.fn()}
        ideationModelCatalog={null}
        isIdeationModelCatalogLoading={false}
        ideationModelPicker={{ mode: 'auto', manualCatalogModelId: '' }}
        onIdeationModelPickerChange={vi.fn()}
        isGenerating={false}
        generateError={null}
        lastGenerationStats={null}
        onGenerate={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>
  );
}

describe('Workbench idea-grid empty states', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('Trend Ideas CTA navigates to Signal Radar Trend Stream', async () => {
    const user = userEvent.setup();
    renderTrend();

    await user.click(screen.getByRole('button', { name: /open signal radar → trend stream/i }));

    expect(navigate).toHaveBeenCalledWith(`${ROUTES.admin.personalBrandingRadar}?tab=trends`);
  });

  it('Vault Extractor CTA focuses vault source search when none selected', async () => {
    const user = userEvent.setup();
    renderVault();

    const searchInput = document.getElementById(VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID);
    expect(searchInput).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /select vault sources/i }));

    await waitFor(() => {
      expect(searchInput).toHaveFocus();
    });
  });

  it('Vault Extractor CTA generates when sources are ready', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    renderVault({
      onGenerate,
      selectedVaultItemIds: ['vault-1'],
    });

    await user.click(screen.getByRole('button', { name: /generate first ideas/i }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('Vault Extractor CTA navigates to Brand Identity when no profiles', async () => {
    const user = userEvent.setup();
    renderVault({ profiles: [], selectedProfileId: null });

    await user.click(screen.getByRole('button', { name: /open brand identity/i }));

    expect(navigate).toHaveBeenCalledWith(
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile`
    );
  });

  it('Ideation Engine CTA calls onGenerate when ready', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    renderIdeation({ onGenerate });

    await user.click(screen.getByRole('button', { name: /generate first ideas/i }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('Ideation Engine CTA navigates to Brand Identity when no profiles', async () => {
    const user = userEvent.setup();
    renderIdeation({ profiles: [], selectedProfileId: null });

    await user.click(screen.getByRole('button', { name: /open brand identity/i }));

    expect(navigate).toHaveBeenCalledWith(
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile`
    );
  });

  it('content library distinguishes a load failure from an empty library', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ContentLibraryPanel
        contentNodes={[]}
        activeDraftId={null}
        onSelect={vi.fn()}
        onNewDraft={vi.fn()}
        loadError
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your content.");
    expect(screen.queryByText('No content yet.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
