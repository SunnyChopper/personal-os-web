type StartupMark = 'main_render' | 'auth_check_start' | 'auth_check_end' | 'app_shell_visible';

const marks = new Map<StartupMark, number>();

/** Dev-only cold-start timing marks (read via `window.__personalOsStartupMarks`). */
export function markStartup(phase: StartupMark): void {
  if (!import.meta.env.DEV) return;
  marks.set(phase, performance.now());
  const w = window as Window & { __personalOsStartupMarks?: Record<string, number> };
  w.__personalOsStartupMarks = Object.fromEntries(marks);
}

export function getStartupMarks(): ReadonlyMap<StartupMark, number> {
  return marks;
}
