import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskCreateForm } from '@/components/organisms/TaskCreateForm';

vi.mock('@/lib/llm', () => ({
  llmConfig: { isConfigured: () => false },
}));

describe('TaskCreateForm initialValues', () => {
  const noop = vi.fn();

  it('seeds Area, Sub-category, and Priority from initialValues', () => {
    render(
      <TaskCreateForm
        onSubmit={noop}
        onCancel={noop}
        initialValues={{
          area: 'Day Job',
          subCategory: 'Projects',
          priority: 'P1',
        }}
      />
    );

    const [areaSelect, subCategorySelect, prioritySelect] = screen.getAllByRole('combobox');
    expect(areaSelect).toHaveValue('Day Job');
    expect(subCategorySelect).toHaveValue('Projects');
    expect(prioritySelect).toHaveValue('P1');
  });

  it('falls back to Operations and P3 when taxonomy initialValues are omitted', () => {
    render(<TaskCreateForm onSubmit={noop} onCancel={noop} />);

    const [areaSelect, , prioritySelect] = screen.getAllByRole('combobox');
    expect(areaSelect).toHaveValue('Operations');
    expect(prioritySelect).toHaveValue('P3');
  });
});
