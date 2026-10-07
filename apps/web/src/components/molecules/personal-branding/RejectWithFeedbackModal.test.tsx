import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RejectWithFeedbackModal from './RejectWithFeedbackModal';

const CATEGORIES = [
  { id: 'tooGeneric', label: 'Too generic' },
  { id: 'offBrand', label: 'Off-brand' },
];

describe('RejectWithFeedbackModal', () => {
  it('requires a category when categoryRequired is true (default with categories)', () => {
    const onSubmit = vi.fn();
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submit = screen.getByRole('button', { name: /reject idea/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Too generic' }));
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(null, 'tooGeneric');
  });

  it('allows submit without category when categoryRequired is false', () => {
    const onSubmit = vi.fn();
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        categoryRequired={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submit = screen.getByRole('button', { name: /reject idea/i });
    expect(submit).not.toBeDisabled();
    expect(screen.getByText(/reason category/i)).toHaveTextContent('(optional)');

    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(null, null);
  });

  it('passes selected category when optional and toggles deselect on second click', () => {
    const onSubmit = vi.fn();
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        categoryRequired={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const chip = screen.getByRole('button', { name: 'Off-brand' });
    fireEvent.click(chip);
    fireEvent.click(chip);
    fireEvent.click(screen.getByRole('button', { name: /reject idea/i }));
    expect(onSubmit).toHaveBeenCalledWith(null, null);

    fireEvent.click(chip);
    fireEvent.click(screen.getByRole('button', { name: /reject idea/i }));
    expect(onSubmit).toHaveBeenLastCalledWith(null, 'offBrand');
  });

  it('with feedbackRequired, disables submit until category and non-empty feedback', () => {
    const onSubmit = vi.fn();
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        feedbackRequired
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submit = screen.getByRole('button', { name: /reject idea/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Too generic' }));
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Too shallow  ' } });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith('Too shallow', 'tooGeneric');
  });

  it('with feedbackRequired, blocks over-2000 characters with inline alert', () => {
    const onSubmit = vi.fn();
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        feedbackRequired
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Too generic' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x'.repeat(2001) } });

    const submit = screen.getByRole('button', { name: /reject idea/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('2000 characters or fewer');
  });

  it('shows errorMessage in alert and Saving… while submitting', () => {
    render(
      <RejectWithFeedbackModal
        isOpen
        categories={CATEGORIES}
        feedbackRequired
        errorMessage="Network failed"
        isSubmitting
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network failed');
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
