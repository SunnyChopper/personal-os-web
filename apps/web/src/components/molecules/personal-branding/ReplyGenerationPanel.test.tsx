import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ReplyGenerationPanel from './ReplyGenerationPanel';

vi.mock('@/services/chatbot.service', () => ({
  chatbotService: {
    getAssistantModelCatalog: vi.fn().mockResolvedValue({
      models: [
        {
          id: 'model-1',
          label: 'Test model',
          provider: 'openai',
          apiModelId: 'gpt-test',
          capabilityTags: [],
        },
      ],
    }),
  },
}));

function renderPanel(props: Partial<ComponentProps<typeof ReplyGenerationPanel>> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <ReplyGenerationPanel
        platform="x"
        profiles={[{ id: 'profile-1', name: 'Main profile' }]}
        onGenerate={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

describe('ReplyGenerationPanel', () => {
  it('renders inline Generate button by default', async () => {
    renderPanel();

    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('omits inline Generate and publishes controls when placement is external', async () => {
    const onGenerateControlsChange = vi.fn();

    renderPanel({
      generateButtonPlacement: 'external',
      onGenerateControlsChange,
    });

    await waitFor(() => {
      const latestControls = onGenerateControlsChange.mock.calls.at(-1)?.[0];
      expect(latestControls).toMatchObject({
        suggestionCount: expect.any(Number),
        disabled: false,
        isGenerating: false,
      });
      expect(typeof latestControls?.generate).toBe('function');
    });

    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();
    expect(screen.getByText(/Suggestions \(\d+\)/)).toBeInTheDocument();
  });
});
