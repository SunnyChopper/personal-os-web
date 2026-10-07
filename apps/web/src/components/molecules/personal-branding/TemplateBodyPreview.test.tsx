import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TemplateBodyPreview from './TemplateBodyPreview';

describe('TemplateBodyPreview', () => {
  it('renders structured tweet blocks by default for thread bodies', () => {
    render(
      <TemplateBodyPreview
        body={`1/ Hook — bold claim

2/ Context — why this matters`}
      />
    );

    expect(screen.getByRole('button', { name: 'Structure' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('Tweet 1')).toBeInTheDocument();
    expect(screen.getByText('Tweet 2')).toBeInTheDocument();
    expect(screen.getByText(/Hook — bold claim/)).toBeInTheDocument();
  });

  it('switches to raw pre when Raw is selected', async () => {
    const user = userEvent.setup();
    const body = `1/ Hook

2/ Context`;

    render(<TemplateBodyPreview body={body} />);

    await user.click(screen.getByRole('button', { name: 'Raw' }));

    expect(screen.getByRole('button', { name: 'Raw' })).toHaveAttribute('aria-pressed', 'true');
    const pre = document.querySelector('pre');
    expect(pre?.textContent).toBe(body);
  });

  it('renders raw-only without toggle for unstructured bodies', () => {
    render(<TemplateBodyPreview body="Plain unstructured template text." />);

    expect(screen.queryByRole('button', { name: 'Structure' })).not.toBeInTheDocument();
    expect(screen.getByText('Plain unstructured template text.')).toBeInTheDocument();
  });
});
