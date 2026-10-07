import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReplyPolishingStrip from './ReplyPolishingStrip';

describe('ReplyPolishingStrip', () => {
  it('renders polish progress without skeleton cards', () => {
    render(
      <ReplyPolishingStrip
        run={{
          id: 'run-1',
          connectionId: 'conn-1',
          platform: 'x',
          creatorText: 'hello',
          mode: 'AGENT',
          researchEnabled: false,
          vaultGroundingEnabled: false,
          suggestionCount: 2,
          status: 'RUNNING',
          userId: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          suggestions: [
            {
              id: 's1',
              runId: 'run-1',
              connectionId: 'conn-1',
              label: 'Warm',
              angle: 'warmth',
              draftText: 'early draft',
              rationale: 'ok',
              status: 'SUGGESTED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }}
        nowMs={Date.now()}
      />
    );

    expect(screen.getByTestId('reply-polishing-strip')).toBeInTheDocument();
    expect(screen.getByLabelText('Reply polish progress')).toBeInTheDocument();
    expect(screen.queryByTestId('reply-suggestion-card-skeleton')).not.toBeInTheDocument();
  });
});
