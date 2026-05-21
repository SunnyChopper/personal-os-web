import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssistantTraceJsonViewer } from '@/components/molecules/AssistantTraceJsonViewer';

describe('AssistantTraceJsonViewer', () => {
  it('shows top-level keys and collapses nested objects by default', () => {
    render(
      <AssistantTraceJsonViewer
        data={{
          items: [{ id: '1' }],
          total: 2,
          nested: { a: 1 },
        }}
        topLevelExpanded
      />
    );
    expect(screen.getByText('items')).toBeInTheDocument();
    expect(screen.getByText(/^total/)).toBeInTheDocument();
    expect(screen.getByText('nested')).toBeInTheDocument();
    expect(screen.getByText('Array(1)')).toBeInTheDocument();
    expect(screen.getAllByText('Object(1)').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('id')).not.toBeInTheDocument();
  });
});
