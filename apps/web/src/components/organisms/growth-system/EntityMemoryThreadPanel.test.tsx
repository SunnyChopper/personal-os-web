import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EntityMemoryThreadPanel } from '@/components/organisms/growth-system/EntityMemoryThreadPanel';

describe('EntityMemoryThreadPanel', () => {
  it('renders quiet empty state CTA when thread is empty in non-collapsible mode', async () => {
    const onEmptyAction = vi.fn();
    const fetchThread = vi.fn().mockResolvedValue({
      entityType: 'project',
      entityId: 'proj-1',
      entityName: 'Alpha',
      items: [],
      totalItems: 0,
    });

    render(
      <MemoryRouter>
        <EntityMemoryThreadPanel
          entityType="project"
          entityId="proj-1"
          fetchThread={fetchThread}
          onEmptyAction={onEmptyAction}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'No memory linked yet' })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Link a logbook entry or start a memory thread' })
    );
    expect(onEmptyAction).toHaveBeenCalledTimes(1);
  });

  it('renders collapsible header with count and defaults to collapsed', async () => {
    const fetchThread = vi.fn().mockResolvedValue({
      entityType: 'project',
      entityId: 'proj-1',
      entityName: 'Alpha',
      items: [],
      totalItems: 0,
    });

    render(
      <MemoryRouter>
        <EntityMemoryThreadPanel
          entityType="project"
          entityId="proj-1"
          fetchThread={fetchThread}
          collapsible
          defaultOpen={false}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /memory thread \(0\)/i })).toBeInTheDocument();
    });

    const toggle = screen.getByRole('button', { name: /memory thread \(0\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays non-zero count and expands to reveal thread items when clicked', async () => {
    const user = userEvent.setup();
    const fetchThread = vi.fn().mockResolvedValue({
      entityType: 'project',
      entityId: 'proj-1',
      entityName: 'Alpha',
      items: [
        {
          sourceType: 'logbookEntry',
          sourceKey: 'entry-1',
          occurredAt: '2026-05-01T12:00:00Z',
          category: 'Progress',
          excerpt: 'Made great progress on first phase.',
          matchMethod: 'nameMatch',
          logbookDate: '2026-05-01',
        },
      ],
      totalItems: 1,
    });

    render(
      <MemoryRouter>
        <EntityMemoryThreadPanel
          entityType="project"
          entityId="proj-1"
          fetchThread={fetchThread}
          collapsible
          defaultOpen={false}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /memory thread \(1\)/i })).toBeInTheDocument();
    });

    const toggle = screen.getByRole('button', { name: /memory thread \(1\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Made great progress on first phase.')).toBeInTheDocument();
  });
});
