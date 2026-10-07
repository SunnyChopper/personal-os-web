import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlatformRuleSetPreviewPanel from '@/components/molecules/personal-branding/PlatformRuleSetPreviewPanel';

describe('PlatformRuleSetPreviewPanel', () => {
  it('highlights active influence excerpt in preview body', async () => {
    const user = userEvent.setup();
    const onSelectExcerpt = vi.fn();

    render(
      <PlatformRuleSetPreviewPanel
        sampleText="Original sample"
        onSampleTextChange={() => undefined}
        preview={{
          sampleText: 'Original sample',
          body: 'First step. Second step. Third step.',
          appliedPolicy: {
            rhetoricalModes: [],
            rhetoricalDevices: [],
            requirements: '',
            appliedRuleIds: [],
          },
        }}
        isLoading={false}
        error={null}
        isStale={false}
        influences={[
          {
            kind: 'device',
            id: 'ruleOfThree',
            summary: 'Rule of three used in steps',
            previewExcerpt: 'Second step.',
          },
        ]}
        influenceLoading={false}
        influenceError={null}
        activeExcerpt="Second step."
        onSelectExcerpt={onSelectExcerpt}
      />
    );

    expect(screen.getByText('Second step.')).toBeInTheDocument();
    expect(screen.getByText('Second step.').tagName).toBe('MARK');

    await user.click(screen.getByRole('button', { name: /rule of three used in steps/i }));
    expect(onSelectExcerpt).toHaveBeenCalledWith(null);
  });

  it('highlights influence excerpts inside rendered Markdown headings', () => {
    render(
      <PlatformRuleSetPreviewPanel
        sampleText="Original sample"
        onSampleTextChange={() => undefined}
        preview={{
          sampleText: 'Original sample',
          body: '# A practical takeaway\n\nThe body follows.',
          appliedPolicy: {
            rhetoricalModes: [],
            rhetoricalDevices: [],
            requirements: [],
            appliedRuleIds: [],
          },
        }}
        isLoading={false}
        error={null}
        isStale={false}
        influences={[
          {
            kind: 'requirement',
            id: 'takeaway',
            summary: 'Lead with a takeaway',
            previewExcerpt: 'A practical takeaway',
          },
        ]}
        influenceLoading={false}
        influenceError={null}
        activeExcerpt="A practical takeaway"
        onSelectExcerpt={() => undefined}
      />
    );

    expect(screen.getByText('A practical takeaway').tagName).toBe('MARK');
  });
});
