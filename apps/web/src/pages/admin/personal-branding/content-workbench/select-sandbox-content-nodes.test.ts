import { describe, expect, it } from 'vitest';
import type { ContentNode } from '@/types/api/personal-branding.dto';
import { selectSandboxContentNodes } from './select-sandbox-content-nodes';

function makeNode(overrides: Partial<ContentNode> = {}): ContentNode {
  return {
    id: 'content-1',
    title: 'Draft post',
    status: 'DRAFT',
    sourceType: 'MANUAL',
    contentType: 'DEEP_DIVE_BLOG',
    body: '',
    tags: [],
    pillars: [],
    userId: 'user-1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('selectSandboxContentNodes', () => {
  it('reads items from unwrapped paginated page at .data', () => {
    const draft = makeNode({ id: 'draft-1', title: 'Saved draft' });
    const nodes = selectSandboxContentNodes({
      data: [draft],
      total: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.id).toBe('draft-1');
  });

  it('returns empty when page is undefined', () => {
    expect(selectSandboxContentNodes(undefined)).toEqual([]);
  });

  it('excludes SKIPPED nodes and preserves API order', () => {
    const older = makeNode({
      id: 'older',
      status: 'DRAFT',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    const newer = makeNode({
      id: 'newer',
      status: 'PUBLISHED',
      updatedAt: '2026-08-03T00:00:00.000Z',
    });
    const skipped = makeNode({
      id: 'skipped',
      status: 'SKIPPED',
      updatedAt: '2026-08-04T00:00:00.000Z',
    });
    const nodes = selectSandboxContentNodes({
      data: [older, skipped, newer],
      total: 3,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    expect(nodes.map((n) => n.id)).toEqual(['older', 'newer']);
  });

  it('returns only SKIPPED nodes in archived mode', () => {
    const active = makeNode({ id: 'active', status: 'DRAFT' });
    const archived = makeNode({ id: 'archived', status: 'SKIPPED' });
    const nodes = selectSandboxContentNodes(
      {
        data: [active, archived],
        total: 2,
        page: 1,
        pageSize: 100,
        hasMore: false,
      },
      'archived'
    );
    expect(nodes.map((n) => n.id)).toEqual(['archived']);
  });
});
