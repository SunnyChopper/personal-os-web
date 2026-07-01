import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CareerResumeDraftEditor } from './CareerResumeDraftEditor';
import type { CareerGeneratedResume } from '@/types/api/career.types';

const baseDraft: CareerGeneratedResume = {
  id: 'resume-1',
  achievementIds: [],
  resumeMarkdown: '## Summary\nHello',
  resumePlainText: 'Hello',
  atsKeywordsUsed: [],
  draftRevision: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  resumeSections: [
    {
      sectionId: 'summary',
      sectionType: 'summary',
      title: 'Summary',
      contentMarkdown: 'Hello',
      contentPlainText: 'Hello',
      sourceAchievementIds: [],
      manuallyEdited: false,
      provenanceOk: true,
    },
  ],
};

describe('CareerResumeDraftEditor', () => {
  it('PATCH shape on save with sectionId and contentMarkdown', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <CareerResumeDraftEditor
        draft={baseDraft}
        onSaveSection={onSave}
        onRegenerateSection={vi.fn()}
      />
    );

    const textarea = screen.getByDisplayValue('Hello');
    await user.clear(textarea);
    await user.type(textarea, 'Updated summary');
    await user.click(screen.getByRole('button', { name: /save section/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('summary', 'Updated summary');
    });
  });

  it('calls regenerate with section id only', async () => {
    const user = userEvent.setup();
    const onRegen = vi.fn().mockResolvedValue(undefined);

    render(
      <CareerResumeDraftEditor
        draft={baseDraft}
        onSaveSection={vi.fn()}
        onRegenerateSection={onRegen}
      />
    );

    await user.click(screen.getByRole('button', { name: /regenerate section/i }));

    await waitFor(() => {
      expect(onRegen).toHaveBeenCalledWith('summary', undefined);
    });
  });
});
