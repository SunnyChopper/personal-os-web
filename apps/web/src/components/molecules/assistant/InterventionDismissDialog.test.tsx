import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterventionDismissDialog } from './InterventionDismissDialog';

describe('InterventionDismissDialog', () => {
  it('uses shared copy and allows dismiss with an empty reason', () => {
    const onConfirm = vi.fn();
    render(
      <InterventionDismissDialog
        isOpen
        reason=""
        onReasonChange={vi.fn()}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('heading', { name: 'Dismiss intervention' })).toBeInTheDocument();
    expect(
      screen.getByText('Tell the Assistant why this is not relevant (helps future nudges).')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveValue('');

    const submit = screen.getByRole('button', { name: 'Dismiss' });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses stacked copy when occurrenceCount > 1', () => {
    render(
      <InterventionDismissDialog
        isOpen
        reason=""
        onReasonChange={vi.fn()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        occurrenceCount={5}
      />
    );
    expect(screen.getByText(/dismisses all 5 similar alerts/i)).toBeInTheDocument();
  });
});
