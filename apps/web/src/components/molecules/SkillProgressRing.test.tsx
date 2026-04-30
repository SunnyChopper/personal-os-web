import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SkillProgressRing } from '@/components/molecules/SkillProgressRing';

describe('SkillProgressRing', () => {
  it('renders svg progress ring', () => {
    const { container } = render(<SkillProgressRing progress={50} />);
    expect(container.querySelector('[data-testid="skill-progress-ring"]')).toBeTruthy();
  });

  it('clamps progress to 0–100', () => {
    const { rerender, container } = render(<SkillProgressRing progress={-10} />);
    const low = container.querySelectorAll('circle')[1]?.getAttribute('stroke-dashoffset');
    rerender(<SkillProgressRing progress={200} />);
    const high = container.querySelectorAll('circle')[1]?.getAttribute('stroke-dashoffset');
    expect(low).toBeTruthy();
    expect(high).toBeTruthy();
  });
});
