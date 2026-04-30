import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import SkillTreePage from '@/pages/admin/SkillTreePage';
import type { SkillTreeApiResponse } from '@/types/knowledge-vault';

const mockGetTree = vi.fn();
const mockCreateSkill = vi.fn();

vi.mock('@/services/knowledge-vault', () => ({
  skillsService: {
    getTree: () => mockGetTree(),
    verifySkill: vi.fn(),
    createSkill: (...args: unknown[]) => mockCreateSkill(...args),
    updateSkill: vi.fn(),
    deleteSkill: vi.fn(),
  },
  vaultPrimitivesService: {
    darkMatter: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

vi.mock('@/components/organisms/GhostNodeUnlockModal', () => ({
  GhostNodeUnlockModal: () => null,
}));

function treeWithSkills(skills: SkillTreeApiResponse['skills']): SkillTreeApiResponse {
  return {
    skills,
    totalSkills: skills.length,
    unlockedSkills: skills.filter((s) => s.isUnlocked).length,
    completedSkills: skills.filter((s) => s.isCompleted).length,
    categories: [...new Set(skills.map((s) => s.category).filter(Boolean))] as string[],
  };
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <SkillTreePage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('SkillTreePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTree.mockResolvedValue({
      success: true,
      data: treeWithSkills([]),
      error: null,
    });
  });

  it('shows Add skill and bulk manage controls', async () => {
    renderPage();
    expect(await screen.findByTestId('add-skill-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-manage-toggle')).toBeInTheDocument();
  });

  it('opens create modal when Add skill is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTestId('add-skill-button'));
    expect(screen.getByTestId('skill-form-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add skill' })).toBeInTheDocument();
  });

  it('shows mastery badge when mastery criteria are met', async () => {
    mockGetTree.mockResolvedValue({
      success: true,
      data: treeWithSkills([
        {
          id: 's1',
          name: 'Mastered skill',
          description: null,
          category: 'general',
          level: 'Master',
          progressPercentage: 100,
          parentSkillIds: [],
          childSkillIds: [],
          resources: [],
          isUnlocked: true,
          isCompleted: true,
          completedAt: '2025-01-01',
          knowledgeHalfLifeDays: 30,
          lastVerifiedAt: '2025-01-01',
          verificationStatus: 'current',
          decayRate: 0.1,
          linkedFlashcardDeckIds: [],
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        },
      ]),
      error: null,
    });
    renderPage();
    const card = await screen.findByTestId('skill-tree-card-s1');
    expect(within(card).getByTestId('mastery-badge-s1')).toBeInTheDocument();
  });

  it('shows bulk action bar when bulk mode and selection', async () => {
    const user = userEvent.setup();
    mockGetTree.mockResolvedValue({
      success: true,
      data: treeWithSkills([
        {
          id: 'a',
          name: 'Alpha',
          description: null,
          category: 'general',
          level: 'Beginner',
          progressPercentage: 0,
          parentSkillIds: [],
          childSkillIds: [],
          resources: [],
          isUnlocked: true,
          isCompleted: false,
          completedAt: null,
          knowledgeHalfLifeDays: null,
          lastVerifiedAt: null,
          verificationStatus: 'current',
          decayRate: 0,
          linkedFlashcardDeckIds: [],
          userId: 'u',
          createdAt: '',
          updatedAt: '',
        },
      ]),
      error: null,
    });
    renderPage();
    await user.click(await screen.findByTestId('bulk-manage-toggle'));
    const card = await screen.findByTestId('skill-tree-card-a');
    await user.click(within(card).getByRole('checkbox', { name: /select alpha/i }));
    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
  });
});
