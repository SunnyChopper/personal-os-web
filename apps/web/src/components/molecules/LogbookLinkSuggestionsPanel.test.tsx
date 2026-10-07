import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LogbookLinkSuggestionsPanel } from '@/components/molecules/LogbookLinkSuggestionsPanel';

const suggestions = [
  {
    entityId: 'project-1',
    entityType: 'project' as const,
    title: 'Personal OS Memory',
    reason: 'Matches AI themes in your note.',
    confidence: 0.82,
  },
  {
    entityId: 'goal-1',
    entityType: 'goal' as const,
    title: 'Rekindle AI curiosity',
    reason: 'Your note discusses curiosity.',
    confidence: 0.75,
  },
];

describe('LogbookLinkSuggestionsPanel', () => {
  it('does not submit a parent form when Link is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onToggle = vi.fn();

    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <LogbookLinkSuggestionsPanel
          suggestions={suggestions}
          linkedEntities={[]}
          hasRequested
          onToggle={onToggle}
        />
      </form>
    );

    await user.click(screen.getAllByRole('button', { name: 'Link' })[0]);

    expect(onToggle).toHaveBeenCalledWith(suggestions[0]);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
