import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolApprovalCard } from '@/components/molecules/ToolApprovalCard';

const basePayload = {
  runId: 'run-1',
  threadId: 'thread-1',
  approvalId: 'apr-1',
  toolName: 'delete_task',
  arguments: { taskId: 't-99' },
  description: 'Permanently delete this task',
};

describe('ToolApprovalCard', () => {
  it('renders description and tool name', () => {
    render(<ToolApprovalCard payload={basePayload} runId="run-1" onRespond={vi.fn()} />);
    expect(screen.getByText('Permanently delete this task')).toBeInTheDocument();
    expect(screen.getByText('delete_task')).toBeInTheDocument();
  });

  it('calls onRespond with approve decision', async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(<ToolApprovalCard payload={basePayload} runId="run-1" onRespond={onRespond} />);
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onRespond).toHaveBeenCalledWith('run-1', 'apr-1', 'approve');
  });

  it('calls onRespond with reject decision', async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(<ToolApprovalCard payload={basePayload} runId="run-1" onRespond={onRespond} />);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onRespond).toHaveBeenCalledWith('run-1', 'apr-1', 'reject');
  });
});
