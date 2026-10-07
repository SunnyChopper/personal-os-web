import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BrandProjectBuildKit, BrandProjectIdea } from '@/types/api/personal-branding.dto';
import BuildIdeaRefinePanel from './BuildIdeaRefinePanel';

const sampleKit: BrandProjectBuildKit = {
  setupPrompt: 'setup',
  cursorSkills: [],
  modules: [],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

function makeIdea(overrides: Partial<BrandProjectIdea> = {}): BrandProjectIdea {
  return {
    id: 'idea-1',
    title: 'Ship a CLI',
    status: 'generated',
    backgroundKnowledge: [],
    technologies: [],
    trendSources: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPanel(overrides: Partial<ComponentProps<typeof BuildIdeaRefinePanel>> = {}) {
  const onSend = overrides.onSend ?? vi.fn().mockResolvedValue(undefined);
  render(
    <BuildIdeaRefinePanel
      idea={makeIdea()}
      kitInFlight={false}
      isSending={false}
      errorMessage={null}
      onSend={onSend}
      {...overrides}
    />
  );
  return { onSend };
}

describe('BuildIdeaRefinePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the transcript', () => {
    renderPanel({
      idea: makeIdea({
        refineTranscript: [
          { role: 'user', content: 'Narrow the demo', createdAt: '2026-10-02T00:00:00.000Z' },
          {
            role: 'assistant',
            content: 'Shortened the demo hook.',
            createdAt: '2026-10-02T00:00:00.000Z',
          },
        ],
      }),
    });

    expect(screen.getByRole('log')).toHaveTextContent('Narrow the demo');
    expect(screen.getByRole('log')).toHaveTextContent('Shortened the demo hook.');
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Revision')).toBeInTheDocument();
  });

  it('sends the trimmed message and clears the draft on success', async () => {
    const user = userEvent.setup();
    const { onSend } = renderPanel();

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Message' }), '  narrower demo  ');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('narrower demo');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  });

  it('sends on ctrl+enter', async () => {
    const user = userEvent.setup();
    const { onSend } = renderPanel();
    const box = screen.getByRole('textbox', { name: 'Message' });

    await user.type(box, 'shorter demo');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(onSend).toHaveBeenCalledWith('shorter demo');
  });

  it('keeps the draft and shows an inline alert when send fails', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error('locked'));
    renderPanel({
      onSend,
      errorMessage: 'Cannot revise an idea that already has a build kit.',
    });

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'make it smaller');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('make it smaller');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('make it smaller');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cannot revise an idea that already has a build kit.'
    );
  });

  it('replaces the composer when a kit exists', () => {
    renderPanel({
      idea: makeIdea({
        buildKit: sampleKit,
        refineTranscript: [
          { role: 'user', content: 'Keep the CLI', createdAt: '2026-10-02T00:00:00.000Z' },
        ],
      }),
    });

    expect(screen.getByText('Refine is locked once a build kit exists.')).toBeInTheDocument();
    expect(screen.getByText('Keep the CLI')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument();
  });

  it('replaces the composer while a kit job is in flight', () => {
    renderPanel({ kitInFlight: true });

    expect(screen.getByText('Refine is locked once a build kit exists.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('renders nothing when the idea is not generated', () => {
    const { container } = render(
      <BuildIdeaRefinePanel
        idea={makeIdea({ status: 'completed' })}
        kitInFlight={false}
        isSending={false}
        errorMessage={null}
        onSend={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
