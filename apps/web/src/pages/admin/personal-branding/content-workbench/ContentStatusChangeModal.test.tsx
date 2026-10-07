import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ContentStatusChangeModal from './ContentStatusChangeModal';

describe('ContentStatusChangeModal', () => {
  it('shows server field errors on publish controls', () => {
    render(
      <ContentStatusChangeModal
        isOpen
        mode="publish"
        contentTitle="My post"
        isPending={false}
        serverFieldErrors={{
          platform: 'Original platform is required when publishing.',
          canonicalUrl: 'Canonical URL must start with http:// or https://',
        }}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Original platform is required when publishing.')).toBeInTheDocument();
    expect(
      screen.getByText('Canonical URL must start with http:// or https://')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Original platform/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Canonical URL/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
