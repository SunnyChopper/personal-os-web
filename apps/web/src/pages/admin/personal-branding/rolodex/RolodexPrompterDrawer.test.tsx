import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';
import type { CreatorConnection } from '@/types/api/personal-branding.dto';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

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

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    saveOperatorBriefingToVault: vi.fn(),
    resolveXContent: vi.fn(),
  },
}));

const baseConnection: CreatorConnection = {
  id: 'conn-1',
  name: 'Ada Lovelace',
  handles: { x: 'ada' },
  conversationAngles: [],
  tags: [],
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderDrawer(
  client: QueryClient,
  props: {
    open: boolean;
    connection: CreatorConnection | null;
  }
) {
  return render(
    <QueryClientProvider client={client}>
      <RolodexPrompterDrawer
        open={props.open}
        connection={props.connection}
        profiles={[]}
        onClose={vi.fn()}
        onGenerate={vi.fn()}
        onAcceptSuggestion={vi.fn()}
        onRejectSuggestion={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe('RolodexPrompterDrawer', () => {
  it('does not throw when connection goes from null to open', () => {
    const client = createClient();
    const { rerender } = renderDrawer(client, { open: false, connection: null });

    rerender(
      <QueryClientProvider client={client}>
        <RolodexPrompterDrawer
          open={true}
          connection={baseConnection}
          profiles={[]}
          onClose={vi.fn()}
          onGenerate={vi.fn()}
          onAcceptSuggestion={vi.fn()}
          onRejectSuggestion={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.getAllByText('Response prompter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
  });

  it('uses compact min-heights on Creator and Intent textareas', () => {
    const client = createClient();
    renderDrawer(client, { open: true, connection: baseConnection });

    const textareas = screen.getAllByRole('textbox');
    const creatorFields = textareas.filter((el) => el.className.includes('min-h-[80px]'));
    const intentFields = textareas.filter((el) => el.className.includes('min-h-[72px]'));

    expect(creatorFields.length).toBeGreaterThan(0);
    for (const creatorField of creatorFields) {
      expect(creatorField.className).not.toContain('min-h-[120px]');
    }

    expect(intentFields.length).toBeGreaterThan(0);
    for (const intentField of intentFields) {
      expect(intentField.className).toContain('resize-y');
    }
  });

  it('does not throw when connection clears while open', () => {
    const client = createClient();
    const { rerender } = renderDrawer(client, { open: true, connection: baseConnection });

    expect(() =>
      rerender(
        <QueryClientProvider client={client}>
          <RolodexPrompterDrawer
            open={true}
            connection={null}
            profiles={[]}
            onClose={vi.fn()}
            onGenerate={vi.fn()}
            onAcceptSuggestion={vi.fn()}
            onRejectSuggestion={vi.fn()}
          />
        </QueryClientProvider>
      )
    ).not.toThrow();
  });

  it('docks Generate in the bottom sheet footer when open', async () => {
    const client = createClient();

    renderDrawer(client, { open: true, connection: baseConnection });

    const generateButtons = await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Generate' });
      expect(buttons.length).toBeGreaterThan(0);
      return buttons;
    });

    for (const button of generateButtons) {
      expect(button.closest('[data-testid="bottom-sheet-footer"]')).not.toBeNull();
      expect(button).toBeDisabled();
    }
  });
});
