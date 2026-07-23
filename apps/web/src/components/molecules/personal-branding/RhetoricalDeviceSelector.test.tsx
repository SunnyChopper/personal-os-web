import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import RhetoricalDeviceSelector from '@/components/molecules/personal-branding/RhetoricalDeviceSelector';
import type {
  PlatformRuleCatalogEntry,
  RhetoricalDeviceId,
} from '@/types/api/personal-branding.dto';

const catalog: PlatformRuleCatalogEntry[] = [
  {
    id: 'metaphor',
    label: 'Metaphor',
    definition: 'Direct comparison.',
    enabledEffect: 'May use metaphors.',
    disabledEffect: 'Do not use metaphors.',
  },
];

function ControlledDeviceSelector() {
  const [value, setValue] = useState<RhetoricalDeviceId[]>([]);
  return <RhetoricalDeviceSelector catalog={catalog} value={value} onChange={setValue} />;
}

describe('RhetoricalDeviceSelector', () => {
  it('hides effect line until device is checked', async () => {
    const user = userEvent.setup();
    render(<ControlledDeviceSelector />);

    expect(screen.queryByText('May use metaphors.')).not.toBeInTheDocument();
    expect(screen.queryByText('Do not use metaphors.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /metaphor/i }));
    expect(screen.getByText('May use metaphors.')).toBeInTheDocument();
  });

  it('applies compact density with line-clamped definition when unchecked', () => {
    render(
      <RhetoricalDeviceSelector
        catalog={catalog}
        value={[]}
        onChange={() => undefined}
        density="compact"
      />
    );

    const definition = screen.getByText('Direct comparison.');
    expect(definition).toHaveClass('line-clamp-2');
    expect(definition).toHaveClass('text-xs');
  });
});
