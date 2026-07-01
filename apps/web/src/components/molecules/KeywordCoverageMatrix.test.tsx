import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KeywordCoverageMatrix } from './KeywordCoverageMatrix';
import type { CareerKeywordCoverageItem } from '@/types/api/career.types';

describe('KeywordCoverageMatrix', () => {
  it('groups experience coverage by mandatory vs nice-to-have', () => {
    const items: CareerKeywordCoverageItem[] = [
      {
        keyword: 'Python',
        requirementLevel: 'mandatory',
        status: 'matched',
        matchedAchievementIds: ['a1'],
        evidenceSnippets: ['Built Python APIs'],
        rationale: 'Exact keyword in achievement bank bullet(s).',
      },
      {
        keyword: 'Kubernetes',
        requirementLevel: 'niceToHave',
        status: 'missing',
        matchedAchievementIds: [],
        evidenceSnippets: [],
        rationale: 'No grounded evidence in achievement bank or profile.',
      },
    ];

    render(<KeywordCoverageMatrix mode="experience" items={items} />);

    expect(screen.getByText('Mandatory')).toBeInTheDocument();
    expect(screen.getByText('Nice to have')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getAllByText(/missing/i).length).toBeGreaterThan(0);
  });

  it('renders resume diff mode with matched and missing counts', () => {
    render(
      <KeywordCoverageMatrix mandatory={['Python', 'Go']} matched={['Python']} missing={['Go']} />
    );

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });
});
