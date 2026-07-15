import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SourceEditorDialog from './SourceEditorDialog';

vi.mock('@/components/molecules/Dialog', () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe('SourceEditorDialog', () => {
  it('starts on the Identify step with Next disabled until name is entered', () => {
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Wizard progress' })).toBeInTheDocument();
    expect(screen.getByText('Identify')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('advances to Configure after name is entered', async () => {
    const user = userEvent.setup();
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'Tech trends');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByLabelText(/Feed URL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('requires endpoint before advancing to Authenticate', async () => {
    const user = userEvent.setup();
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'HN');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText(/Feed URL/), 'https://example.com/feed.xml');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByText(/Add a token only if the feed requires authentication/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create source' })).toBeInTheDocument();
  });

  it('submits RSS create payload from the final step', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={onCreate} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'HN front page');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText(/Feed URL/), 'https://hnrss.org/frontpage');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText('Secret token'), 'rss-secret');
    await user.click(screen.getByRole('button', { name: 'Create source' }));

    expect(onCreate).toHaveBeenCalledWith({
      name: 'HN front page',
      sourceType: 'RSS',
      endpoint: 'https://hnrss.org/frontpage',
      httpMethod: 'GET',
      authScheme: 'NONE',
      authHeaderName: null,
      authQueryParamName: null,
      enabled: true,
      cadence: null,
      cadenceIntervalHours: null,
      secretToken: 'rss-secret',
    });
  });

  it('shows API connection fields when API endpoint type is selected', async () => {
    const user = userEvent.setup();
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'Trend API');
    await user.click(screen.getByRole('button', { name: 'API endpoint' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByLabelText(/Endpoint URL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GET' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'POST' })).toBeInTheDocument();
  });

  it('hides API auth fields after switching back to RSS on step 1', async () => {
    const user = userEvent.setup();
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'Switch test');
    await user.click(screen.getByRole('button', { name: 'API endpoint' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText(/Endpoint URL/), 'https://api.example.com/trends');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Auth scheme')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'RSS feed' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText(/Feed URL/), 'https://example.com/rss');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.queryByLabelText('Auth scheme')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Add a token only if the feed requires authentication/)
    ).toBeInTheDocument();
  });

  it('submits GitHub create payload from the final step', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={onCreate} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'LangGraph');
    await user.click(screen.getByRole('button', { name: 'GitHub repository' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText(/Repository owner/), 'langchain-ai');
    await user.type(screen.getByLabelText(/Repository name/), 'langgraph');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Create source' }));

    expect(onCreate).toHaveBeenCalledWith({
      name: 'LangGraph',
      sourceType: 'GITHUB_REPO',
      endpoint: 'https://github.com/langchain-ai/langgraph',
      httpMethod: 'GET',
      authScheme: 'BEARER',
      authHeaderName: null,
      authQueryParamName: null,
      enabled: true,
      cadence: null,
      cadenceIntervalHours: null,
      secretToken: undefined,
      githubConfig: {
        owner: 'langchain-ai',
        repo: 'langgraph',
        eventTypes: ['COMMITS'],
        releaseFilter: 'ALL',
        aiFilterEnabled: true,
        aiFilterInstructions: null,
      },
    });
  });

  it('shows release filter when Releases event type is selected', async () => {
    const user = userEvent.setup();
    render(<SourceEditorDialog isOpen onClose={vi.fn()} onCreate={vi.fn()} onUpdate={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), 'Repo watch');
    await user.click(screen.getByRole('button', { name: 'GitHub repository' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.queryByLabelText(/Release filter/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Releases' }));
    expect(screen.getByLabelText(/Release filter/)).toBeInTheDocument();
  });

  it('submits update payload in edit mode', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <SourceEditorDialog
        isOpen
        initial={{
          id: 'src-1',
          name: 'Existing feed',
          sourceType: 'RSS',
          endpoint: 'https://example.com/feed.xml',
          httpMethod: 'GET',
          requestParams: {},
          headers: {},
          authScheme: 'NONE',
          hasSecret: true,
          enabled: true,
          userId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onUpdate).toHaveBeenCalledWith('src-1', {
      name: 'Existing feed',
      sourceType: 'RSS',
      endpoint: 'https://example.com/feed.xml',
      httpMethod: 'GET',
      authScheme: 'NONE',
      authHeaderName: null,
      authQueryParamName: null,
      enabled: true,
      cadence: null,
      cadenceIntervalHours: null,
    });
  });
});
