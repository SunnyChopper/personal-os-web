import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VariantDistributionTrackingForm } from './VariantDistributionTrackingForm';
import type { ContentVariant } from '@/types/api/personal-branding.dto';

const baseVariant: ContentVariant = {
  id: 'variant-1',
  sourceContentId: 'content-1',
  jobId: 'job-1',
  brandProfileId: 'profile-1',
  platform: 'linkedin',
  title: 'Test title',
  body: '## Hello\n\nWorld',
  status: 'generated',
  distributionStatus: 'DRAFT',
  generationAttempt: 1,
  characterCount: 100,
  critiqueHistory: [],
  referencedContentIds: [],
  cached: false,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderForm(variant: ContentVariant = baseVariant, onSave = vi.fn(), isSaving = false) {
  return {
    onSave,
    ...render(
      <VariantDistributionTrackingForm variant={variant} isSaving={isSaving} onSave={onSave} />
    ),
  };
}

describe('VariantDistributionTrackingForm', () => {
  it('renders section heading and metric labels', () => {
    renderForm();

    expect(screen.getByText('Distribution tracking')).toBeInTheDocument();
    expect(screen.getByText('Platform URL')).toBeInTheDocument();
    expect(screen.getByText('Posted date')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Likes')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Shares')).toBeInTheDocument();
  });

  it('uses a platform-aware URL placeholder', () => {
    renderForm();

    expect(screen.getByPlaceholderText('https://www.linkedin.com/posts/…')).toBeInTheDocument();
  });

  it('keeps Save tracking disabled when pristine', () => {
    renderForm();

    expect(screen.queryByRole('button', { name: 'Save tracking' })).toBeNull();
  });

  it('enables Save tracking after editing a metric', async () => {
    const user = userEvent.setup();
    renderForm();

    const viewsInput = screen.getByRole('spinbutton', { name: 'Views' });
    await user.type(viewsInput, '42');

    const saveButton = screen.getByRole('button', { name: 'Save tracking' });
    expect(saveButton).toBeEnabled();
  });

  it('enables Save tracking after editing the platform URL', async () => {
    const user = userEvent.setup();
    renderForm();

    const urlInput = screen.getByPlaceholderText('https://www.linkedin.com/posts/…');
    await user.type(urlInput, 'https://example.com/post');

    expect(screen.getByRole('button', { name: 'Save tracking' })).toBeEnabled();
  });

  it('calls onSave with camelCase payload when Save is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderForm(baseVariant, onSave);

    await user.type(screen.getByRole('spinbutton', { name: 'Views' }), '120');
    await user.click(screen.getByRole('button', { name: 'Save tracking' }));

    expect(onSave).toHaveBeenCalledWith('variant-1', {
      platformUrl: null,
      postedAt: null,
      engagement: {
        views: 120,
        likes: null,
        comments: null,
        shares: null,
      },
    });
  });

  it('autosaves on blur', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderForm(baseVariant, onSave);

    const viewsInput = screen.getByRole('spinbutton', { name: 'Views' });
    await user.type(viewsInput, '9');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith('variant-1', {
      platformUrl: null,
      postedAt: null,
      engagement: {
        views: 9,
        likes: null,
        comments: null,
        shares: null,
      },
    });
  });

  it('shows saved summary and footer when variant has tracking data', () => {
    renderForm({
      ...baseVariant,
      platformUrl: 'https://www.linkedin.com/posts/example',
      postedAt: '2026-01-15T12:00:00.000Z',
      engagement: { views: 100, likes: 5, comments: 2, shares: 1 },
    });

    expect(screen.getByRole('link', { name: 'Live post' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/posts/example'
    );
    expect(screen.getByText(/100 views/)).toBeInTheDocument();
  });
});
