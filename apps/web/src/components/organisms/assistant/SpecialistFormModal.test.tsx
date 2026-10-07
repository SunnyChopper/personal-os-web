import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import SpecialistFormModal from './SpecialistFormModal';
import type { AssistantSpecialist } from '@/types/api-contracts';

const specialist: AssistantSpecialist = {
  id: 'knowledge_tutor',
  displayName: 'Knowledge Tutor',
  systemPrompt: 'Advise on learning.',
  enabled: true,
  livingContextDomains: ['tasks'],
  triggers: {
    mode: 'auto',
    keywords: ['course'],
    aliases: [],
    intentCategories: ['knowledge'],
    priority: 20,
  },
  includeBrandProfile: false,
  includeLtm: true,
  includeToolResults: true,
  domainDeltaModules: [],
  toolNames: ['list_tasks'],
  maxToolRounds: 1,
  timeoutSeconds: 12,
  temperature: 0.4,
  modelOverride: null,
  contextCharBudget: 2400,
  corpusIds: [],
  graphEnabled: false,
  graphId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderModal(overrides: Partial<ComponentProps<typeof SpecialistFormModal>> = {}) {
  return render(
    <SpecialistFormModal
      isOpen
      specialist={specialist}
      toolRegistry={[
        {
          name: 'list_tasks',
          description: 'Read open tasks.',
          safeRead: true,
          category: 'growth',
        },
        {
          name: 'delete_task',
          description: 'Delete a task.',
          safeRead: false,
          category: 'growth',
        },
      ]}
      documents={[]}
      uploadingFile={null}
      uploadError={null}
      saving={false}
      saveError={null}
      deletingDocument={false}
      onClose={vi.fn()}
      onSave={vi.fn()}
      onUploadDocument={vi.fn()}
      onDeleteDocument={vi.fn()}
      {...overrides}
    />
  );
}

describe('SpecialistFormModal', () => {
  it('groups the editor into scannable sections and uses shared labels', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Triggers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Context' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Scoped tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Runtime' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Display name/)).toHaveValue('Knowledge Tutor');
    expect(screen.getByRole('combobox', { name: 'Living-context domains' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by tool name or description…')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('keeps Save disabled for a clean edit', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Save specialist' })).toBeDisabled();
  });

  it('shows the dirty status and enables Save after an edit', async () => {
    const user = userEvent.setup();
    renderModal();

    const displayName = screen.getByLabelText(/Display name/);
    await user.clear(displayName);
    await user.type(displayName, 'Knowledge Tutor Plus');

    expect(screen.getByText('Unsaved changes')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Save specialist' })).toBeEnabled();
  });

  it('omits the specialist id from edit payloads', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    const displayName = screen.getByLabelText(/Display name/);
    await user.clear(displayName);
    await user.type(displayName, 'Knowledge Tutor Plus');
    await user.click(screen.getByRole('button', { name: 'Save specialist' }));

    expect(onSave).toHaveBeenCalledWith(expect.not.objectContaining({ id: expect.anything() }));
    expect(onSave.mock.calls[0][0]).toMatchObject({ displayName: 'Knowledge Tutor Plus' });
  });

  it('includes the specialist id in create payloads', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ specialist: null, onSave });

    await user.type(screen.getByLabelText(/Id \(lowercase slug\)/), 'new_specialist');
    await user.type(screen.getByLabelText(/Display name/), 'New Specialist');
    await user.type(screen.getByLabelText(/System prompt/), 'Advise carefully.');
    await user.click(screen.getByRole('button', { name: 'Save specialist' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'new_specialist' }));
  });

  it('allows every safe-read tool returned by the registry', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const toolNames = Array.from({ length: 36 }, (_, index) => `safe_read_tool_${index}`);
    renderModal({
      onSave,
      specialist: { ...specialist, toolNames: [] },
      toolRegistry: toolNames.map((name) => ({
        name,
        description: 'Read-only tool.',
        safeRead: true,
        category: 'assistant',
      })),
    });

    const toolCheckboxes = screen.getAllByRole('checkbox').slice(4, -1);
    expect(toolCheckboxes).toHaveLength(toolNames.length);
    for (const checkbox of toolCheckboxes) {
      fireEvent.click(checkbox);
    }
    await user.click(screen.getByRole('button', { name: 'Save specialist' }));

    expect(onSave.mock.calls[0][0]).toMatchObject({ toolNames });
  });

  it('blocks CSV fields that exceed their backend item limit', async () => {
    renderModal();

    const keywords = screen.getByLabelText('Keywords');
    fireEvent.change(keywords, {
      target: { value: Array.from({ length: 65 }, (_, index) => `keyword-${index}`).join(', ') },
    });
    fireEvent.blur(keywords);

    expect(screen.getByText('Keywords supports at most 64 items.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save specialist' })).toBeDisabled();
  });

  it('keeps Save disabled until a new specialist has a display name', async () => {
    const user = userEvent.setup();
    renderModal({ specialist: null });

    await user.type(screen.getByLabelText(/Id \(lowercase slug\)/), 'new_specialist');
    await user.type(screen.getByLabelText(/System prompt/), 'Advise carefully.');

    expect(screen.getByRole('button', { name: 'Save specialist' })).toBeDisabled();
  });

  it('shows create id validation after the field is blurred', async () => {
    const user = userEvent.setup();
    renderModal({ specialist: null });

    const idInput = screen.getByLabelText(/Id \(lowercase slug\)/);
    await user.type(idInput, 'Bad slug');
    await user.tab();

    expect(
      screen.getByText(/Use 2–64 characters: lowercase letters, numbers, and underscores/)
    ).toBeInTheDocument();
  });
});
