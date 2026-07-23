import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import RhetoricalModeSelector from '@/components/molecules/personal-branding/RhetoricalModeSelector';
import type {
  PlatformRuleCatalogEntry,
  RhetoricalModeSetting,
} from '@/types/api/personal-branding.dto';

const catalog: PlatformRuleCatalogEntry[] = [
  {
    id: 'narrative',
    label: 'Narrative',
    definition: 'Tell a story.',
    enabledEffect: 'Use storytelling.',
    disabledEffect: 'Avoid story arcs.',
  },
];

function ControlledModeSelector() {
  const [value, setValue] = useState<RhetoricalModeSetting[]>([]);
  return (
    <RhetoricalModeSelector
      catalog={catalog}
      strengths={['moderate']}
      value={value}
      onChange={setValue}
    />
  );
}

describe('RhetoricalModeSelector', () => {
  it('hides enabled effect until mode is checked', async () => {
    const user = userEvent.setup();
    render(<ControlledModeSelector />);

    expect(screen.queryByText('When enabled: Use storytelling.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /narrative/i }));
    expect(screen.getByText('When enabled: Use storytelling.')).toBeInTheDocument();
    expect(screen.getByLabelText(/narrative strength/i)).toBeInTheDocument();
  });

  it('applies compact density with line-clamped definition when unchecked', () => {
    render(
      <RhetoricalModeSelector
        catalog={catalog}
        strengths={['moderate']}
        value={[]}
        onChange={() => undefined}
        density="compact"
      />
    );

    const definition = screen.getByText('Tell a story.');
    expect(definition).toHaveClass('line-clamp-2');
    expect(definition).toHaveClass('text-xs');
  });
});
