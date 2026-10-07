import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { BrandProfile, RadarItem } from '@/types/api/personal-branding.dto';
import TrendStreamBrainstormModal from './TrendStreamBrainstormModal';

vi.mock('@/hooks/useTerminalJobFailureAlert', () => ({
  useTerminalJobFailureAlert: vi.fn(),
}));

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    listContentTemplates: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

const selectedItem = {
  id: 'radar-1',
  title: 'A useful signal',
  itemType: 'ARTICLE',
  relevanceScore: 0.9,
  matchedPillars: ['Leadership'],
  userId: 'user-1',
  createdAt: '2026-08-01T00:00:00.000Z',
} as RadarItem;

function profile(id: string, platforms: BrandProfile['platforms']): BrandProfile {
  return {
    id,
    name: `${id} profile`,
    pillars: ['Leadership'],
    targetAudience: 'Founders',
    toneMetrics: {},
    bannedPhrases: [],
    platforms,
    status: 'active',
    userId: 'user-1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

function renderModal(overrides: Partial<ComponentProps<typeof TrendStreamBrainstormModal>> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TrendStreamBrainstormModal
        open
        selectedItems={[selectedItem]}
        profiles={[profile('x-only', ['x']), profile('medium', ['medium'])]}
        profilesLoading={false}
        defaultBrandProfileId="x-only"
        targetPlatform="medium"
        onTargetPlatformChange={vi.fn()}
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        {...overrides}
      />
    </QueryClientProvider>
  );
}

describe('TrendStreamBrainstormModal profile and image defaults', () => {
  it('keeps the selected platform on reopen and selects matching profiles by default', async () => {
    const { rerender } = renderModal();

    await waitFor(() => {
      expect(screen.getByLabelText('medium profile')).toBeChecked();
    });
    expect(screen.getByLabelText('x-only profile')).not.toBeChecked();
    expect(screen.getByLabelText('Target platform')).toHaveValue('medium');

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <TrendStreamBrainstormModal
          open={false}
          selectedItems={[selectedItem]}
          profiles={[profile('x-only', ['x']), profile('medium', ['medium'])]}
          profilesLoading={false}
          defaultBrandProfileId="x-only"
          targetPlatform="medium"
          onTargetPlatformChange={vi.fn()}
          isSubmitting={false}
          errorMessage={null}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </QueryClientProvider>
    );
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <TrendStreamBrainstormModal
          open
          selectedItems={[selectedItem]}
          profiles={[profile('x-only', ['x']), profile('medium', ['medium'])]}
          profilesLoading={false}
          defaultBrandProfileId="x-only"
          targetPlatform="medium"
          onTargetPlatformChange={vi.fn()}
          isSubmitting={false}
          errorMessage={null}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText('Target platform')).toHaveValue('medium');
  });

  it('submits the selected profile ids and image idea count', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    await waitFor(() => {
      expect(screen.getByLabelText('medium profile')).toBeChecked();
    });
    await user.selectOptions(screen.getAllByRole('combobox')[2], '2');
    await user.click(screen.getByRole('button', { name: 'Generate ideas' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        brandProfileIds: ['medium'],
        targetPlatform: 'medium',
        imageIdeaCount: 2,
      })
    );
  });
});
