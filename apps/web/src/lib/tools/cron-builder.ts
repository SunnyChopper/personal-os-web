/**
 * Build a 5-field cron string from coarse controls (client-side; shared with Cron Builder + workflow trigger).
 * Fields: minute hour day-of-month month day-of-week
 */

import cronstrue from 'cronstrue';

export type CronQuickPreset = 'every-minute' | 'weekdays-9' | 'hourly' | 'daily-midnight';

const PRESETS: Record<CronQuickPreset, string> = {
  'every-minute': '* * * * *',
  hourly: '0 * * * *',
  'daily-midnight': '0 0 * * *',
  'weekdays-9': '0 9 * * 1-5',
};

export function cronFromPreset(preset: CronQuickPreset): string {
  return PRESETS[preset];
}

export function describeCron(expression: string): { ok: boolean; human?: string; error?: string } {
  try {
    return { ok: true, human: cronstrue.toString(expression) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid expression' };
  }
}
