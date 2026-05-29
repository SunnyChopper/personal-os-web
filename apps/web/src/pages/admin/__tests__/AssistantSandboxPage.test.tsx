import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AssistantSandboxPage from '../AssistantSandboxPage';
import { assistantSandboxService } from '@/services/assistant-sandbox.service';

vi.mock('@/services/assistant-sandbox.service', () => ({
  assistantSandboxService: {
    getSession: vi.fn(),
    createSession: vi.fn(),
  },
}));

vi.mock('@/lib/vite-public-env', () => ({
  getResolvedWsUrl: () => 'wss://example.test/ws',
}));

vi.mock('@/lib/auth/auth.service', () => ({
  authService: {
    getValidAccessToken: vi.fn().mockResolvedValue('token'),
  },
}));

const mockSession = {
  sessionId: 'sess-1',
  sourceExecutionId: 'exec-1',
  systemPrompt: 'You are a test assistant.',
  messages: [{ role: 'user', text: 'Hello' }],
  provider: 'openai',
  model: 'gpt-5-mini',
  temperature: 0.2,
  maxTokens: 1024,
  createdAt: '2026-05-28T00:00:00.000Z',
  expiresAt: '2026-05-28T01:00:00.000Z',
};

function renderPage(initialEntry = '/admin/assistant/sandbox?session=sess-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/assistant/sandbox" element={<AssistantSandboxPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AssistantSandboxPage', () => {
  beforeEach(() => {
    vi.mocked(assistantSandboxService.getSession).mockResolvedValue(mockSession);
  });

  it('hydrates session from query param', async () => {
    renderPage();
    await waitFor(() => {
      expect(assistantSandboxService.getSession).toHaveBeenCalledWith('sess-1');
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('You are a test assistant.')).toBeInTheDocument();
    });
    expect(screen.getByText(/mutating tools are dry-run/i)).toBeInTheDocument();
  });
});
