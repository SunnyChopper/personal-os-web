import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DraftSettingsModal from './DraftSettingsModal';

describe('DraftSettingsModal', () => {
  it('edits content type, platform, and canonical URL', () => {
    const onContentTypeChange = vi.fn();
    const onDraftPlatformChange = vi.fn();
    const onDraftCanonicalUrlChange = vi.fn();

    render(
      <DraftSettingsModal
        isOpen
        onClose={vi.fn()}
        contentType="DEEP_DIVE_BLOG"
        onContentTypeChange={onContentTypeChange}
        draftPlatform="medium"
        onDraftPlatformChange={onDraftPlatformChange}
        draftCanonicalUrl=""
        onDraftCanonicalUrlChange={onDraftCanonicalUrlChange}
        isSaving={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Social Thread' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Draft target platform' }), {
      target: { value: 'linkedin' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Canonical URL' }), {
      target: { value: 'https://example.com/thread' },
    });

    expect(onContentTypeChange).toHaveBeenCalledWith('SOCIAL_THREAD');
    expect(onDraftPlatformChange).toHaveBeenCalledWith('linkedin');
    expect(onDraftCanonicalUrlChange).toHaveBeenCalledWith('https://example.com/thread');
    expect(screen.getByRole('button', { name: 'Deep-Dive Blog' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('disables draft settings controls while saving', () => {
    render(
      <DraftSettingsModal
        isOpen
        onClose={vi.fn()}
        contentType="SOCIAL_THREAD"
        onContentTypeChange={vi.fn()}
        draftPlatform={null}
        onDraftPlatformChange={vi.fn()}
        draftCanonicalUrl=""
        onDraftCanonicalUrlChange={vi.fn()}
        isSaving
      />
    );

    expect(screen.getByRole('button', { name: 'Deep-Dive Blog' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Draft target platform' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Canonical URL' })).toBeDisabled();
  });
});
