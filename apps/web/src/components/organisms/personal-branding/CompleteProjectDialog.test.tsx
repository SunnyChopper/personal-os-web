import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CompleteProjectDialog from './CompleteProjectDialog';

vi.mock('@/components/molecules/Dialog', () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe('CompleteProjectDialog', () => {
  it('disables Save links when every field is empty or whitespace', () => {
    const onSubmit = vi.fn();
    render(<CompleteProjectDialog open title="Demo" onClose={vi.fn()} onSubmit={onSubmit} />);

    const save = screen.getByRole('button', { name: /save links/i });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getAllByPlaceholderText('https://')[0], {
      target: { value: '   ' },
    });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows https message and does not submit for http URLs', () => {
    const onSubmit = vi.fn();
    render(<CompleteProjectDialog open title="Demo" onClose={vi.fn()} onSubmit={onSubmit} />);

    const inputs = screen.getAllByPlaceholderText('https://');
    fireEvent.change(inputs[0], { target: { value: 'http://insecure.example' } });

    const save = screen.getByRole('button', { name: /save links/i });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);

    expect(screen.getByRole('alert')).toHaveTextContent(/https:\/\//i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits only trimmed filled platforms with https URLs', () => {
    const onSubmit = vi.fn();
    render(<CompleteProjectDialog open title="Demo" onClose={vi.fn()} onSubmit={onSubmit} />);

    const inputs = screen.getAllByPlaceholderText('https://');
    fireEvent.change(inputs[0], { target: { value: '  https://x.com/post/1  ' } });
    fireEvent.change(inputs[2], { target: { value: 'https://linkedin.com/in/me' } });

    fireEvent.click(screen.getByRole('button', { name: /save links/i }));

    expect(onSubmit).toHaveBeenCalledWith([
      { platform: 'x', url: 'https://x.com/post/1' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/me' },
    ]);
  });

  it('renders server error prop', () => {
    render(
      <CompleteProjectDialog
        open
        title="Demo"
        error="Request validation failed. Url: url must use https"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('url must use https');
  });

  it('does not render an Other URL field', () => {
    render(<CompleteProjectDialog open title="Demo" onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('X post URL')).toBeInTheDocument();
    expect(screen.getByText('YouTube URL')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn URL')).toBeInTheDocument();
    expect(screen.queryByText(/other/i)).not.toBeInTheDocument();
  });
});
