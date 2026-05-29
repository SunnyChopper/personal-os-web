import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssistantSettingsPage from '@/pages/admin/AssistantSettingsPage';
import { apiClient } from '@/lib/api-client';
import type { AssistantSettingsConfig } from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getAssistantSettings: vi.fn(),
    getAssistantToolRegistry: vi.fn(),
    getAssistantModelCatalog: vi.fn(),
    setAssistantSettings: vi.fn(),
    resetAssistantMemoryIngestion: vi.fn(),
    resetAssistantDefaultModels: vi.fn(),
  },
}));

const catalog: AssistantModelCatalogData = {
  providersConfigured: { openai: true },
  models: [
    {
      id: 'openai:a',
      provider: 'openai',
      apiModelId: 'a',
      label: 'Model A',
      supportsReasoningStream: true,
      speedScore: 5,
      costScore: 5,
      qualityScore: 5,
    },
    {
      id: 'openai:b',
      provider: 'openai',
      apiModelId: 'b',
      label: 'Model B',
      supportsReasoningStream: false,
      speedScore: 5,
      costScore: 5,
      qualityScore: 5,
    },
  ],
  defaults: { defaultReasoningModelId: 'openai:a', defaultResponseModelId: 'openai:b' },
};

const baseSettings: AssistantSettingsConfig = {
  toolApproval: { mode: 'dangerousOnly', dangerousTools: [] },
  memoryIngestion: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    factCriteria: { alwaysCapture: [], neverCapture: [] },
  },
  memoryIngestionIsCustom: false,
  defaultModels: { mode: 'auto', auto: { optimizeFor: 'intelligence' } },
  defaultModelsIsCustom: false,
};

describe('AssistantSettingsPage default models', () => {
  beforeEach(() => {
    vi.mocked(apiClient.getAssistantSettings).mockResolvedValue({
      success: true,
      data: baseSettings,
    });
    vi.mocked(apiClient.getAssistantToolRegistry).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(apiClient.getAssistantModelCatalog).mockResolvedValue({
      success: true,
      data: catalog,
    });
    vi.mocked(apiClient.setAssistantSettings).mockResolvedValue({
      success: true,
      data: {
        ...baseSettings,
        defaultModels: {
          mode: 'manual',
          manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
        },
        defaultModelsIsCustom: true,
      },
    });
    vi.mocked(apiClient.resetAssistantDefaultModels).mockResolvedValue({
      success: true,
      data: baseSettings,
    });
  });

  it('renders Default models section after load', async () => {
    render(<AssistantSettingsPage />);
    expect(await screen.findByRole('heading', { name: 'Default models' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset to Auto (server default)' })).toBeDisabled();
  });

  it('saves defaultModels with the unified settings PUT', async () => {
    render(<AssistantSettingsPage />);
    await screen.findByRole('heading', { name: 'Default models' });
    fireEvent.click(screen.getByRole('button', { name: 'manual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save all settings' }));

    await waitFor(() => {
      expect(apiClient.setAssistantSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultModels: {
            mode: 'manual',
            manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
          },
        })
      );
    });
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
  });

  it('resets default models via DELETE endpoint', async () => {
    vi.mocked(apiClient.getAssistantSettings).mockResolvedValue({
      success: true,
      data: {
        ...baseSettings,
        defaultModels: {
          mode: 'manual',
          manual: { reasoningModelId: 'openai:a', responseModelId: 'openai:b' },
        },
        defaultModelsIsCustom: true,
      },
    });

    render(<AssistantSettingsPage />);
    await screen.findByRole('heading', { name: 'Default models' });
    const resetBtn = screen.getByRole('button', { name: 'Reset to Auto (server default)' });
    expect(resetBtn).toBeEnabled();
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(apiClient.resetAssistantDefaultModels).toHaveBeenCalled();
    });
  });
});
