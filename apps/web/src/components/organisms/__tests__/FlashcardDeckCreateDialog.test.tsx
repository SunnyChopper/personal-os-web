import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashcardDeckCreateDialog from '../FlashcardDeckCreateDialog';

vi.mock('@/contexts/KnowledgeVault', () => ({
  useKnowledgeVault: () => ({
    createFlashcardDeck: vi.fn(),
    vaultItems: [],
    courses: [],
  }),
}));

vi.mock('@/services/knowledge-vault', () => ({
  aiFlashcardGeneratorService: {
    generateFromText: vi.fn(),
    regenerateCard: vi.fn(),
  },
}));

describe('FlashcardDeckCreateDialog', () => {
  it('shows mode selection first', () => {
    render(<FlashcardDeckCreateDialog onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('How would you like to build this deck?')).toBeInTheDocument();
    expect(screen.getByText('Create manually')).toBeInTheDocument();
    expect(screen.getByText('Generate from vault')).toBeInTheDocument();
  });

  it('navigates to manual flow', () => {
    render(<FlashcardDeckCreateDialog onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Create manually'));
    expect(screen.getByPlaceholderText('e.g. Quantum computing — midterm')).toBeInTheDocument();
    expect(screen.getByText('Optional metadata (area, tags)')).toBeInTheDocument();
  });
});
