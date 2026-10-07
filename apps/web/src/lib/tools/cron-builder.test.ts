import { describe, expect, it } from 'vitest';
import { cronControlsFromExpression } from '@/lib/tools/cron-builder';

describe('cronControlsFromExpression', () => {
  it('maps unrestricted minute and hour to every', () => {
    expect(cronControlsFromExpression('* * * * *')).toEqual({
      minute: 'every',
      minuteN: '*',
      hour: 'every',
      hourN: '*',
      dom: '*',
      month: '*',
      dow: '*',
    });
  });

  it('keeps stepped minutes as a custom field', () => {
    expect(cronControlsFromExpression('*/15 9 * * 1-5')).toMatchObject({
      minute: 'n',
      minuteN: '*/15',
      hour: 'n',
      hourN: '9',
      dow: '1-5',
    });
  });

  it('rejects expressions that are not five fields', () => {
    expect(cronControlsFromExpression('0 0 9 * * 1')).toBeNull();
  });
});
