import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ContentIdeaWhyCreateSection } from './ContentIdeaWhyCreateSection';

const SHORT_RATIONALE = 'Pillar fit reinforces your ops-first positioning.';
const LONG_RATIONALE =
  'Pillar fit reinforces your ops-first positioning with a clear audience job-to-be-done. ' +
  'Platform format fit favors a concise thread that differentiates from generic AI hype. ' +
  'Funnel role: top-of-funnel awareness without invented engagement metrics.';

describe('ContentIdeaWhyCreateSection', () => {
  it('renders rationale under Why create this label', () => {
    render(<ContentIdeaWhyCreateSection rationale={SHORT_RATIONALE} />);
    expect(screen.getByText('Why create this')).toBeInTheDocument();
    expect(screen.getByText(SHORT_RATIONALE)).toBeInTheDocument();
  });

  it('uses ClampedExpandableText with 3-line clamp', () => {
    render(<ContentIdeaWhyCreateSection rationale={LONG_RATIONALE} />);

    const rationaleNode = screen.getByRole('button', { name: LONG_RATIONALE });
    expect(rationaleNode).toHaveClass('line-clamp-3');
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('toggles pinned expand on click', async () => {
    const user = userEvent.setup();
    render(<ContentIdeaWhyCreateSection rationale={LONG_RATIONALE} />);

    const rationaleNode = screen.getByRole('button', { name: LONG_RATIONALE });
    await user.click(rationaleNode);

    expect(rationaleNode).not.toHaveClass('line-clamp-3');
    expect(rationaleNode).toHaveAttribute('aria-expanded', 'true');
  });
});
