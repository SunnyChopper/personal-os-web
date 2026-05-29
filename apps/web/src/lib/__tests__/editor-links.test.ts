import { describe, expect, it } from 'vitest';
import {
  buildEditorUri,
  classifyTracePathScope,
  groupStackTraceLines,
  isNativeTracePath,
  mapTracePathToLocal,
  parseStackTrace,
  parseStackTraceLine,
  PYTHON_FRAME_RE,
} from '@/lib/editor-links';

const REPO_ROOT_WIN = 'C:\\Users\\dev\\personal-os';
const REPO_ROOT_POSIX = '/Users/dev/personal-os';

describe('PYTHON_FRAME_RE', () => {
  it('matches standard Python frame lines', () => {
    const line = '  File "/var/task/src/services/foo.py", line 42, in bar';
    expect(PYTHON_FRAME_RE.test(line)).toBe(true);
    const m = PYTHON_FRAME_RE.exec(line);
    expect(m?.[2]).toBe('/var/task/src/services/foo.py');
    expect(m?.[4]).toBe('42');
    expect(m?.[5]).toBe(', in bar');
  });

  it('matches Windows paths with backslashes', () => {
    const line = '  File "C:\\Users\\dev\\personal-os\\personal-os-backend\\src\\x.py", line 7';
    const m = PYTHON_FRAME_RE.exec(line);
    expect(m?.[2]).toContain('personal-os-backend');
    expect(m?.[4]).toBe('7');
  });
});

describe('mapTracePathToLocal', () => {
  it('returns null when repo root is empty', () => {
    expect(mapTracePathToLocal('/var/task/src/a.py', '')).toBeNull();
  });

  it('rewrites Lambda /var/task paths under personal-os-backend', () => {
    const mapped = mapTracePathToLocal(
      '/var/task/src/services/observability/llm_observer.py',
      REPO_ROOT_POSIX
    );
    expect(mapped).toBe(
      '/Users/dev/personal-os/personal-os-backend/src/services/observability/llm_observer.py'
    );
  });

  it('maps via repo-marker slice for nested absolute paths', () => {
    const mapped = mapTracePathToLocal(
      '/opt/python/foo/personal-os-backend/src/api/routes/x.py',
      REPO_ROOT_POSIX
    );
    expect(mapped).toBe('/Users/dev/personal-os/personal-os-backend/src/api/routes/x.py');
  });

  it('maps personal-os-web marker paths', () => {
    const mapped = mapTracePathToLocal(
      '/home/runner/work/personal-os-web/apps/web/src/App.tsx',
      REPO_ROOT_POSIX
    );
    expect(mapped).toBe('/Users/dev/personal-os/personal-os-web/apps/web/src/App.tsx');
  });

  it('keeps paths already under local repo root', () => {
    const raw = `${REPO_ROOT_POSIX}/personal-os-backend/src/foo.py`;
    expect(mapTracePathToLocal(raw, REPO_ROOT_POSIX)).toBe(raw);
  });

  it('keeps Windows paths already under repo root', () => {
    const raw = `${REPO_ROOT_WIN}\\personal-os-backend\\src\\foo.py`;
    const mapped = mapTracePathToLocal(raw, REPO_ROOT_WIN);
    expect(mapped).toBe(raw);
  });

  it('returns null for site-packages paths', () => {
    expect(
      mapTracePathToLocal(
        '/usr/local/lib/python3.12/site-packages/boto3/__init__.py',
        REPO_ROOT_POSIX
      )
    ).toBeNull();
  });
});

describe('buildEditorUri', () => {
  it('returns null for protocol none', () => {
    expect(buildEditorUri('/tmp/a.py', 1, 'none')).toBeNull();
  });

  it('builds cursor and vscode URIs with line suffix', () => {
    const path = '/Users/dev/personal-os/personal-os-backend/src/a.py';
    expect(buildEditorUri(path, 10, 'cursor')).toBe(`cursor://file/${encodeURI(path)}:10`);
    expect(buildEditorUri(path, 10, 'vscode')).toBe(`vscode://file/${encodeURI(path)}:10`);
  });

  it('encodes spaces in paths', () => {
    const path = 'C:/Users/dev/My Projects/personal-os/personal-os-backend/a.py';
    const uri = buildEditorUri(path, 3, 'cursor');
    expect(uri).toContain('My%20Projects');
    expect(uri).toMatch(/:3$/);
  });
});

describe('parseStackTraceLine', () => {
  const settings = { localRepoRoot: REPO_ROOT_POSIX, protocol: 'cursor' as const };

  it('returns plain lines for non-frame text', () => {
    expect(parseStackTraceLine('Traceback (most recent call last):', settings)).toEqual({
      kind: 'plain',
      text: 'Traceback (most recent call last):',
    });
  });

  it('attaches href for mappable frame lines', () => {
    const line = '  File "/var/task/src/foo.py", line 5, in main';
    const parsed = parseStackTraceLine(line, settings);
    expect(parsed.kind).toBe('frame');
    if (parsed.kind !== 'frame') return;
    expect(parsed.href).toBe(
      buildEditorUri('/Users/dev/personal-os/personal-os-backend/src/foo.py', 5, 'cursor')
    );
  });

  it('omits href when path cannot be mapped', () => {
    const line = '  File "/usr/lib/python3.12/logging/__init__.py", line 1, in emit';
    const parsed = parseStackTraceLine(line, settings);
    expect(parsed.kind).toBe('frame');
    if (parsed.kind !== 'frame') return;
    expect(parsed.href).toBeNull();
    expect(parsed.frameScope).toBe('external');
  });

  it('marks Lambda and repo-marker paths as native', () => {
    const lambdaLine = '  File "/var/task/src/assistant/engine.py", line 10, in run';
    const parsed = parseStackTraceLine(lambdaLine, settings);
    expect(parsed.kind).toBe('frame');
    if (parsed.kind !== 'frame') return;
    expect(parsed.frameScope).toBe('native');
  });
});

describe('classifyTracePathScope', () => {
  const settings = { localRepoRoot: REPO_ROOT_POSIX, protocol: 'cursor' as const };

  it('classifies site-packages as external', () => {
    expect(
      classifyTracePathScope(
        '/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py',
        settings
      )
    ).toBe('external');
  });

  it('classifies dist-packages and venv paths as external', () => {
    expect(classifyTracePathScope('/opt/python/dist-packages/boto3/__init__.py', settings)).toBe(
      'external'
    );
    expect(classifyTracePathScope('/home/dev/.venv/lib/python3.12/foo.py', settings)).toBe(
      'external'
    );
  });

  it('classifies personal-os-backend marker paths as native', () => {
    expect(
      classifyTracePathScope(
        '/opt/python/foo/personal-os-backend/src/services/observability/llm_observer.py',
        settings
      )
    ).toBe('native');
  });
});

describe('isNativeTracePath', () => {
  it('returns true for lambda task and repo markers', () => {
    expect(isNativeTracePath('/var/task/src/foo.py')).toBe(true);
    expect(isNativeTracePath('/x/personal-os-web/apps/web/src/App.tsx')).toBe(true);
  });

  it('returns false for site-packages', () => {
    expect(isNativeTracePath('/usr/lib/python3.12/site-packages/requests/api.py')).toBe(false);
  });
});

describe('groupStackTraceLines', () => {
  const settings = { localRepoRoot: REPO_ROOT_POSIX, protocol: 'none' as const };

  it('groups contiguous external frames and keeps native/plain visible', () => {
    const text = [
      'Traceback (most recent call last):',
      '  File "/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py", line 100, in invoke',
      '  File "/usr/local/lib/python3.12/site-packages/langchain_core/runnables/base.py", line 200, in _call',
      '  File "/var/task/src/assistant/engine.py", line 42, in agent_callable',
      'ValueError: boom',
    ].join('\n');

    const parsed = parseStackTrace(text, settings);
    const segments = groupStackTraceLines(parsed, settings);

    expect(segments).toHaveLength(4);
    expect(segments[0]).toMatchObject({ kind: 'line', lineIndex: 0 });
    expect(segments[1]).toMatchObject({ kind: 'externalGroup', groupIndex: 0 });
    const group = segments[1];
    if (group.kind !== 'externalGroup') throw new Error('expected external group');
    expect(group.frames).toHaveLength(2);
    expect(segments[2]).toMatchObject({ kind: 'line', lineIndex: 3 });
    expect(segments[3]).toMatchObject({ kind: 'line', lineIndex: 4 });
  });

  it('splits external groups when separated by native frames', () => {
    const text = [
      '  File "/usr/lib/python3.12/logging/__init__.py", line 1, in emit',
      '  File "/var/task/src/foo.py", line 5, in main',
      '  File "/usr/lib/python3.12/asyncio/base_events.py", line 2, in run',
    ].join('\n');

    const parsed = parseStackTrace(text, settings);
    const segments = groupStackTraceLines(parsed, settings);

    expect(segments.filter((s) => s.kind === 'externalGroup')).toHaveLength(2);
    expect(segments.filter((s) => s.kind === 'line')).toHaveLength(1);
  });
});
