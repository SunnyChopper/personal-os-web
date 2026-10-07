import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/routes';
import { TOOL_NAV_GROUPS, TOOL_PHASE_LABELS } from '@/lib/tools/tool-nav';

describe('TOOL_NAV_GROUPS', () => {
  const items = TOOL_NAV_GROUPS.flatMap((group) => group.items);

  it('lists Cron Builder as a scheduling tool, without Workflow Engine', () => {
    expect(items.some((item) => item.href === ROUTES.admin.tools.cronBuilder)).toBe(true);
    expect(items.some((item) => item.name === 'Workflow Engine')).toBe(false);
    expect(TOOL_NAV_GROUPS.some((group) => group.id === 'orchestration')).toBe(false);
    expect(TOOL_PHASE_LABELS['phase-3']).toBe('Scheduling');
  });

  it('lists Webhook Catcher and does not list Local Postman', () => {
    expect(items.some((item) => item.href === ROUTES.admin.tools.webhooks)).toBe(true);
    expect(items.some((item) => item.name === 'Local Postman')).toBe(false);
    expect(items.some((item) => item.href === ROUTES.admin.tools.postman)).toBe(false);
  });
});
