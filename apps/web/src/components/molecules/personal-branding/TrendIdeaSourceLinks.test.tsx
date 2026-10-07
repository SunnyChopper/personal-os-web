import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { RadarItemSnapshot } from '@/types/api/personal-branding.dto';
import { TrendIdeaSourceLinks } from './TrendIdeaSourceLinks';

function makeSnapshot(id: string, title: string): RadarItemSnapshot {
  return {
    id,
    title,
    url: `https://example.com/${id}`,
    sourceName: 'X',
  };
}

describe('TrendIdeaSourceLinks', () => {
  it('renders nothing when snapshots is empty', () => {
    const { container } = render(<TrendIdeaSourceLinks snapshots={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders up to two links without an expander', () => {
    const snapshots = [makeSnapshot('a', 'First link'), makeSnapshot('b', 'Second link')];
    render(<TrendIdeaSourceLinks snapshots={snapshots} />);

    expect(screen.getByRole('link', { name: /First link/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Second link/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument();
  });

  it('shows first two links and +N more when collapsed', () => {
    const snapshots = [
      makeSnapshot('a', 'Alpha signal'),
      makeSnapshot('b', 'Beta signal'),
      makeSnapshot('c', 'Gamma signal'),
      makeSnapshot('d', 'Delta signal'),
    ];
    render(<TrendIdeaSourceLinks snapshots={snapshots} />);

    expect(screen.getByRole('link', { name: /Alpha signal/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Beta signal/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Gamma signal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Delta signal/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2 more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('expands remaining links and toggles back to collapsed', async () => {
    const user = userEvent.setup();
    const snapshots = [
      makeSnapshot('a', 'Alpha signal'),
      makeSnapshot('b', 'Beta signal'),
      makeSnapshot('c', 'Gamma signal'),
      makeSnapshot('d', 'Delta signal'),
    ];
    render(<TrendIdeaSourceLinks snapshots={snapshots} />);

    await user.click(screen.getByRole('button', { name: '+2 more' }));

    expect(screen.getByRole('link', { name: /Gamma signal/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Delta signal/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'Show less' }));

    expect(screen.queryByRole('link', { name: /Gamma signal/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2 more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});
