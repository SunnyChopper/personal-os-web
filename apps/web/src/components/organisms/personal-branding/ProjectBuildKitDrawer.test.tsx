import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectBuildKitDrawer from './ProjectBuildKitDrawer';
import type { BrandProjectBuildKit } from '@/types/api/personal-branding.dto';

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

const kit: BrandProjectBuildKit = {
  setupPrompt: 'setup-prompt-text',
  cursorSkills: [],
  modules: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProjectBuildKitDrawer', () => {
  it('shows Copied and writes setup prompt to clipboard on success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    render(<ProjectBuildKitDrawer open ideaTitle="Demo idea" kit={kit} onClose={vi.fn()} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('setup-prompt-text');
    });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Copied' }).length).toBeGreaterThan(0);
    });
  });

  it('shows failure alert and keeps Copy label when clipboard rejects', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    render(<ProjectBuildKitDrawer open ideaTitle="Demo idea" kit={kit} onClose={vi.fn()} />);

    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('alert')[0]).toHaveTextContent("Couldn't copy");
    });
    expect(copyButtons[0]).toHaveTextContent('Copy');
  });
});
