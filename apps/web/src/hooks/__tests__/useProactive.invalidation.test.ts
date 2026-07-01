import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('useProactive query keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('automations mutation invalidates automations query key', async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    await qc.invalidateQueries({ queryKey: queryKeys.proactive.automations() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.proactive.automations() });
  });

  it('suggestions mutation invalidates suggestions query key', async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    await qc.invalidateQueries({ queryKey: queryKeys.proactive.suggestions() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.proactive.suggestions() });
  });
});
