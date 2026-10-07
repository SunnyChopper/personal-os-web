import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { BrandProfile, ContentIdea } from '@/types/api/personal-branding.dto';
import VaultExtractorTab from './VaultExtractorTab';

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

const vaultIdea: ContentIdea = {
  id: 'idea-vault-1',
  title: 'Vault-sourced idea',
  summary: 'Summary',
  angle: null,
  rationale: 'Because',
  contentType: 'SOCIAL_THREAD',
  sourceType: 'VAULT_EXTRACTED',
  sourceRefId: 'note-1',
  linkedGoalIds: [],
  linkedTaskIds: [],
  vaultItemIds: ['note-1'],
  vaultItemSnapshots: [{ id: 'note-1', title: 'Frozen vault title', type: 'note' }],
  radarItemIds: [],
  radarItemSnapshots: [],
  tags: [],
  matchedPillars: [],
  targetPlatform: 'linkedin',
  enableImageSearch: false,
  status: 'GENERATED',
  draftNodeId: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderVault(overrides: Partial<ComponentProps<typeof VaultExtractorTab>> = {}) {
  const {
    vaultEnableImageSearch = false,
    onVaultEnableImageSearchChange = vi.fn(),
    ...rest
  } = overrides;
  return render(
    <MemoryRouter>
      <VaultExtractorTab
        ideas={[vaultIdea]}
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
        vaultItemLabels={{ 'note-1': 'Live session label' }}
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

describe('VaultExtractorTab vault provenance chips', () => {
  it('prefers frozen vaultItemSnapshots titles over live session labels', () => {
    renderVault();

    expect(screen.getByText('Frozen vault title')).toBeInTheDocument();
    expect(screen.queryByText('Live session label')).not.toBeInTheDocument();
  });

  it('falls back to session labels when snapshots are absent', () => {
    renderVault({
      ideas: [
        {
          ...vaultIdea,
          vaultItemSnapshots: [],
        },
      ],
    });

    expect(screen.getByText('Live session label')).toBeInTheDocument();
  });
});
