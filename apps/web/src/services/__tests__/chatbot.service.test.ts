import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatbotService } from '@/services/chatbot.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getChatThreads: vi.fn(),
    getPendingCoachEscalations: vi.fn(),
  },
}));

describe('chatbotService.getThreads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a bare thread array in envelope data', async () => {
    vi.mocked(apiClient.getChatThreads).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'thread-1',
          userId: 'user-1',
          title: 'Chat',
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-10T00:00:00Z',
          lastMessageAt: '2026-05-30T16:00:00Z',
        },
        {
          id: 'thread-2',
          userId: 'user-1',
          title: 'Older',
          createdAt: '2026-05-02T00:00:00Z',
          updatedAt: '2026-05-02T00:00:00Z',
        },
      ],
    });

    const threads = await chatbotService.getThreads();
    expect(threads.map((thread) => thread.id)).toEqual(['thread-1', 'thread-2']);
  });

  it('treats an empty array as success', async () => {
    vi.mocked(apiClient.getChatThreads).mockResolvedValue({
      success: true,
      data: [],
    });

    await expect(chatbotService.getThreads()).resolves.toEqual([]);
  });

  it('rejects non-array data payloads', async () => {
    vi.mocked(apiClient.getChatThreads).mockResolvedValue({
      success: true,
      data: {
        items: [],
      } as unknown as [],
    });

    await expect(chatbotService.getThreads()).rejects.toThrow('Failed to fetch threads');
  });
});

describe('chatbotService.getPendingCoachEscalations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes AbortSignal through to apiClient (3dd6d1c5e76d)', async () => {
    const controller = new AbortController();
    vi.mocked(apiClient.getPendingCoachEscalations).mockResolvedValue({
      success: true,
      data: { escalations: [] },
    });

    await chatbotService.getPendingCoachEscalations(controller.signal);

    expect(apiClient.getPendingCoachEscalations).toHaveBeenCalledWith({
      signal: controller.signal,
    });
  });
});
