import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RadarItem } from '@/types/api/personal-branding.dto';
import GenerateProjectsPickerModal from './GenerateProjectsPickerModal';

const radarState = {
  rows: [] as RadarItem[],
  isPending: false,
  isError: false,
  error: null as Error | null,
};

vi.mock('@/hooks/useSignalRadar', () => ({
  useSignalRadarItems: () => ({
    items: {
      data: {
        data: radarState.rows,
        total: radarState.rows.length,
        page: 1,
        pageSize: 50,
        hasMore: false,
      },
      isPending: radarState.isPending,
      isError: radarState.isError,
      error: radarState.error,
    },
  }),
}));

function radarItem(overrides: Partial<RadarItem> & Pick<RadarItem, 'id' | 'title'>): RadarItem {
  return {
    itemType: 'ARTICLE',
    relevanceScore: 0,
    matchedPillars: [],
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('GenerateProjectsPickerModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConfirm.mockClear();
    radarState.rows = [];
    radarState.isPending = false;
    radarState.isError = false;
    radarState.error = null;
  });

  it('prechecks the strongest today cards and blocks an eleventh selection', async () => {
    const user = userEvent.setup();
    radarState.rows = [
      radarItem({ id: 'low', title: 'Low signal', aiRelevanceScore: 0.1 }),
      ...Array.from({ length: 10 }, (_, index) =>
        radarItem({
          id: `top-${index}`,
          title: `Top ${index}`,
          aiRelevanceScore: 0.5 + index / 100,
        })
      ),
    ];

    render(
      <GenerateProjectsPickerModal open isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />
    );

    expect(await screen.findByRole('checkbox', { name: 'Select Top 9' })).toBeChecked();
    const low = screen.getByRole('checkbox', { name: 'Select Low signal' });
    expect(low).not.toBeChecked();
    expect(low).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not confirm on cancel', async () => {
    const user = userEvent.setup();
    radarState.rows = [radarItem({ id: 'only', title: 'Only signal', aiRelevanceScore: 0.8 })];

    render(
      <GenerateProjectsPickerModal open isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />
    );

    const dialog = await screen.findByRole('dialog', { name: 'Choose trend cards' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms the prechecked ids', async () => {
    const user = userEvent.setup();
    radarState.rows = [
      radarItem({ id: 'low', title: 'Low signal', aiRelevanceScore: 0.2 }),
      radarItem({ id: 'high', title: 'High signal', aiRelevanceScore: 0.9 }),
      radarItem({
        id: 'old',
        title: 'Yesterday signal',
        aiRelevanceScore: 1,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    render(
      <GenerateProjectsPickerModal open isSubmitting={false} onClose={onClose} onConfirm={onConfirm} />
    );

    expect(await screen.findByRole('checkbox', { name: 'Select High signal' })).toBeChecked();
    expect(screen.queryByText('Yesterday signal')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith(['high', 'low']);
  });
});