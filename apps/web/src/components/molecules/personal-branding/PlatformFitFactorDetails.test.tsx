import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PlatformFitFactors } from '@/types/api/personal-branding.dto';
import { PlatformFitFactorDetails } from './PlatformFitFactorDetails';

function buildFactors(overrides?: Partial<PlatformFitFactors>): PlatformFitFactors {
  return {
    lengthFit: { score: 0.9, detail: 'Within character limit.' },
    structureFit: { score: 0.85, detail: 'Short, thread-friendly structure suits this platform.' },
    pillarFit: {
      score: 0.5,
      matchedPillars: ['Leadership'],
      detail: 'Matched pillars: Leadership.',
    },
    rulesFit: {
      score: 0.6,
      appliedRuleIds: [],
      detail: '1 rule(s) with partial policy configured.',
    },
    ...overrides,
  };
}

describe('PlatformFitFactorDetails', () => {
  it('renders all four factor labels and rounded score percentages', () => {
    render(<PlatformFitFactorDetails factors={buildFactors()} />);

    expect(screen.getByText('Length')).toBeInTheDocument();
    expect(screen.getByText('Structure')).toBeInTheDocument();
    expect(screen.getByText('Pillars')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();

    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('orders factors weakest score first', () => {
    render(<PlatformFitFactorDetails factors={buildFactors()} />);

    const labels = screen.getAllByText(/^(Length|Structure|Pillars|Rules)$/);
    expect(labels.map((node) => node.textContent)).toEqual([
      'Pillars',
      'Rules',
      'Structure',
      'Length',
    ]);
  });

  it('shows Show more for long factor detail and toggles full text', async () => {
    const user = userEvent.setup();
    const longPillarDetail =
      'Matched pillars: Mechanistic learning models for reasoning, Agentic workflow engineering for production systems, ' +
      'Retrieval-augmented generation patterns for grounded assistants, and evaluation harness design for trustworthy automation.';
    const factors = buildFactors({
      pillarFit: {
        score: 0.5,
        matchedPillars: ['Leadership'],
        detail: longPillarDetail,
      },
    });

    render(<PlatformFitFactorDetails factors={factors} />);

    expect(screen.getByText(/Mechanistic learning models/)).toBeInTheDocument();
    expect(screen.queryByText(/evaluation harness design/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByText(longPillarDetail)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('does not show Show more for short factor details', () => {
    render(<PlatformFitFactorDetails factors={buildFactors()} />);

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});
