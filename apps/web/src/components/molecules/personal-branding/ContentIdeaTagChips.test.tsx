import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentIdeaTagChips, splitVisibleTags } from './ContentIdeaTagChips';

describe('splitVisibleTags', () => {
  it('returns all tags visible when at or below max', () => {
    expect(splitVisibleTags(['a', 'b', 'c'], 3)).toEqual({
      visible: ['a', 'b', 'c'],
      hidden: [],
    });
  });

  it('splits overflow tags after max visible', () => {
    expect(splitVisibleTags(['a', 'b', 'c', 'd', 'e'], 3)).toEqual({
      visible: ['a', 'b', 'c'],
      hidden: ['d', 'e'],
    });
  });
});

describe('ContentIdeaTagChips', () => {
  it('renders nothing when tags are empty', () => {
    const { container } = render(<ContentIdeaTagChips tags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all tags without overflow when at or below max', () => {
    render(<ContentIdeaTagChips tags={['alpha', 'beta', 'gamma']} />);

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.getByText('gamma')).toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('renders first three tags and +N overflow chip', () => {
    render(
      <ContentIdeaTagChips
        tags={['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']}
      />
    );

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.queryByText('four')).not.toBeInTheDocument();
    expect(screen.queryByText('eight')).not.toBeInTheDocument();

    const overflow = screen.getByText('+5');
    expect(overflow).toHaveAttribute('title', 'four, five, six, seven, eight');
    expect(overflow).toHaveAttribute('aria-label', '5 more tags: four, five, six, seven, eight');
  });
});
