import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlatformRulePolicySummary from '@/components/molecules/personal-branding/PlatformRulePolicySummary';
import type { PlatformRuleCatalog } from '@/types/api/personal-branding.dto';

const catalog: PlatformRuleCatalog = {
  modes: [
    {
      id: 'descriptive',
      label: 'Descriptive',
      definition: 'Paint a picture.',
      enabledEffect: 'Use vivid detail.',
      disabledEffect: 'Stay abstract.',
    },
    {
      id: 'instructional',
      label: 'Instructional',
      definition: 'Teach step by step.',
      enabledEffect: 'Use steps.',
      disabledEffect: 'Avoid how-tos.',
    },
  ],
  devices: [
    {
      id: 'anecdote',
      label: 'Anecdote',
      definition: 'Short story.',
      enabledEffect: 'May use anecdotes.',
      disabledEffect: 'No anecdotes.',
    },
    {
      id: 'ruleOfThree',
      label: 'Rule of Three',
      definition: 'Triads.',
      enabledEffect: 'Use triplets.',
      disabledEffect: 'Avoid triads.',
    },
  ],
  strengths: ['subtle', 'light', 'moderate', 'strong', 'dominant'],
  wordsPerMinute: 200,
};

describe('PlatformRulePolicySummary', () => {
  it('renders modes and devices as separate chips with catalog labels', () => {
    render(
      <PlatformRulePolicySummary
        catalog={catalog}
        rhetoricalModes={[
          { mode: 'descriptive', strength: 'light' },
          { mode: 'instructional', strength: 'strong' },
        ]}
        rhetoricalDevices={['anecdote', 'ruleOfThree']}
        requirements={null}
      />
    );

    expect(screen.getByText('Descriptive')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Instructional')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('Anecdote')).toBeInTheDocument();
    expect(screen.getByText('Rule of Three')).toBeInTheDocument();
    expect(screen.queryByText(/descriptive \(light\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/anecdote, ruleOfThree/i)).not.toBeInTheDocument();
  });

  it('renders requirements as discrete lines', () => {
    render(
      <PlatformRulePolicySummary
        catalog={catalog}
        rhetoricalModes={[]}
        rhetoricalDevices={[]}
        requirements={'- Use the thread format\n- Avoid em-dashes\n- Do NOT use hashtags'}
      />
    );

    expect(screen.getByText('Use the thread format')).toBeInTheDocument();
    expect(screen.getByText('Avoid em-dashes')).toBeInTheDocument();
    expect(screen.getByText('Do NOT use hashtags')).toBeInTheDocument();
  });

  it('humanizes ids when catalog is unavailable', () => {
    render(
      <PlatformRulePolicySummary
        rhetoricalModes={[{ mode: 'persuasive', strength: 'moderate' }]}
        rhetoricalDevices={['rhetoricalQuestion']}
        requirements={null}
      />
    );

    expect(screen.getByText('Persuasive')).toBeInTheDocument();
    expect(screen.getByText('Rhetorical Question')).toBeInTheDocument();
  });

  it('shows compact meta row for limits', () => {
    render(
      <PlatformRulePolicySummary
        catalog={catalog}
        characterLimit={280}
        readTimeLimitMinutes={3}
        rhetoricalModes={[]}
        rhetoricalDevices={[]}
        requirements={null}
      />
    );

    expect(screen.getByText('280')).toBeInTheDocument();
    expect(screen.getByText('3 min')).toBeInTheDocument();
  });
});
