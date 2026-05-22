import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '@/types/growth-system';

const mockBreakdown = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/services/llm.service', () => ({
  llmService: {
    breakdownTask: (...args: unknown[]) => mockBreakdown(...args),
  },
}));

vi.mock('@/lib/llm', () => ({
  llmConfig: { isConfigured: () => false },
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => mockCreate(...args),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { tasksService } from '@/services/growth-system/tasks.service';

const parent: Task = {
  id: 'parent-1',
  title: 'Parent',
  description: 'Desc',
  extendedDescription: null,
  area: 'Operations',
  subCategory: null,
  priority: 'P2',
  status: 'In Progress',
  size: 8,
  dueDate: null,
  scheduledDate: null,
  completedDate: null,
  notes: null,
  isRecurring: false,
  recurrenceRule: null,
  pointValue: 10,
  pointsAwarded: false,
  projectIds: ['proj-1'],
  goalIds: [],
  userId: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('tasksService.createVelocityDragSplit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBreakdown.mockResolvedValue({
      success: true,
      data: {
        subtasks: [
          { title: 'Step A', area: 'Operations', size: 1, status: 'Not Started' },
          { title: 'Step B', area: 'Operations', size: 1, status: 'Not Started' },
        ],
        reasoning: 'AI split',
      },
      error: null,
    });
    mockCreate.mockImplementation(async (_path: string, body: Record<string, unknown>) => ({
      success: true,
      data: { id: `sub-${body.title}`, ...body },
    }));
  });

  it('creates subtasks with parentTaskId and size 1', async () => {
    const result = await tasksService.createVelocityDragSplit(parent);
    expect(result.created).toHaveLength(2);
    expect(mockBreakdown).toHaveBeenCalledWith(parent);
    const taskPosts = mockCreate.mock.calls.filter((c) => c[0] === '/tasks');
    expect(taskPosts.length).toBe(2);
    const firstBody = taskPosts[0][1] as Record<string, unknown>;
    expect(firstBody.parentTaskId).toBe('parent-1');
    expect(firstBody.size).toBe(1);
  });
});
