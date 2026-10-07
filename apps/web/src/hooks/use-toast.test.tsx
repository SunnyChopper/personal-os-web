import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastHost } from '@/components/molecules/ToastHost';
import { clearToastNotifications, pushToastNotification, useToast } from '@/hooks/use-toast';

function ToastConsumerA() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => showToast({ type: 'success', title: 'Recon Feed settings saved' })}
    >
      Save from consumer A
    </button>
  );
}

function ToastConsumerB() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ type: 'error', title: 'Save failed' })}>
      Save from consumer B
    </button>
  );
}

describe('useToast / ToastHost', () => {
  beforeEach(() => {
    clearToastNotifications();
  });

  it('renders exactly one visible toast with a single ToastHost and two consumers', () => {
    render(
      <>
        <ToastConsumerA />
        <ToastConsumerB />
        <ToastHost />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save from consumer A' }));

    expect(screen.getByText('Recon Feed settings saved')).toBeInTheDocument();
    expect(screen.getAllByText('Recon Feed settings saved')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shares imperative pushToastNotification with ToastHost', () => {
    render(<ToastHost />);

    act(() => {
      pushToastNotification({ type: 'info', title: 'Queued from hook callback' });
    });

    expect(screen.getByText('Queued from hook callback')).toBeInTheDocument();
    expect(screen.getAllByText('Queued from hook callback')).toHaveLength(1);
  });
});
