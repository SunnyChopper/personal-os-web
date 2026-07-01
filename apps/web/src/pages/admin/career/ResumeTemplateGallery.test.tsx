import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResumeTemplateGallery } from './ResumeTemplateGallery';

describe('ResumeTemplateGallery', () => {
  it('renders built-in templates and changes selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ResumeTemplateGallery
        templates={[
          {
            templateId: 'standard_professional',
            name: 'Standard professional',
            isBuiltIn: true,
            supportedFormats: ['pdf', 'docx', 'markdown', 'plainText'],
          },
          {
            templateId: 'modern_ats',
            name: 'Modern ATS',
            isBuiltIn: true,
            supportedFormats: ['pdf', 'docx', 'markdown', 'plainText'],
          },
        ]}
        selectedId="standard_professional"
        onSelect={onSelect}
        onImport={vi.fn()}
      />
    );
    expect(screen.getByText('Standard professional')).toBeInTheDocument();
    await user.click(screen.getByText('Modern ATS'));
    expect(onSelect).toHaveBeenCalledWith('modern_ats');
  });
});
