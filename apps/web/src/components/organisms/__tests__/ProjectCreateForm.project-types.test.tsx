import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCreateForm } from '@/components/organisms/ProjectCreateForm';

describe('ProjectCreateForm project types', () => {
  it('hides software metadata fields when type is General', () => {
    const onSubmit = vi.fn();
    render(<ProjectCreateForm onSubmit={onSubmit} onCancel={() => {}} />);
    expect(screen.queryByText('Repo URLs')).toBeNull();
  });

  it('shows Repo URLs when Software development is selected', () => {
    const onSubmit = vi.fn();
    render(<ProjectCreateForm onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Project type'), {
      target: { value: 'SoftwareDevelopment' },
    });
    expect(screen.getByText('Repo URLs')).toBeTruthy();
  });
});
