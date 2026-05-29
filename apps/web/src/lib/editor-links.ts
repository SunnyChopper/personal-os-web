/** Match Python traceback frame lines: `  File "<path>", line <N>[, in <func>]`. */
export const PYTHON_FRAME_RE = /^(\s*File\s+")(.+?)(",\s*line\s+)(\d+)(.*)$/;

export type EditorProtocol = 'cursor' | 'vscode' | 'none';

const REPO_MARKERS = ['/personal-os-backend/', '/personal-os-web/'] as const;
const LAMBDA_TASK_PREFIX = '/var/task/';

function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, '/');
}

function trimTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '');
}

function isWindowsStylePath(path: string): boolean {
  return /^[A-Za-z]:/.test(path) || path.includes('\\');
}

function joinLocalPath(repoRoot: string, relativeFromRepoRoot: string): string {
  const useBackslashes = isWindowsStylePath(repoRoot);
  const root = trimTrailingSlash(normalizeSlashes(repoRoot));
  const rel = relativeFromRepoRoot.replace(/^\/+/, '').replace(/\\/g, '/');
  const joined = `${root}/${rel}`;
  return useBackslashes ? joined.replace(/\//g, '\\') : joined;
}

/**
 * Map a traceback file path to a local absolute path under `localRepoRoot`, or null if unmappable.
 */
export function mapTracePathToLocal(rawPath: string, localRepoRoot: string): string | null {
  const root = localRepoRoot.trim();
  if (!root) return null;

  const normalizedRaw = normalizeSlashes(rawPath);
  const normalizedRoot = trimTrailingSlash(normalizeSlashes(root));

  if (normalizedRaw.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`)) {
    return isWindowsStylePath(root) ? rawPath.replace(/\//g, '\\') : normalizedRaw;
  }

  if (normalizedRaw.startsWith(LAMBDA_TASK_PREFIX)) {
    const rest = normalizedRaw.slice(LAMBDA_TASK_PREFIX.length);
    return joinLocalPath(root, `personal-os-backend/${rest}`);
  }

  let bestMarkerIndex = -1;
  for (const marker of REPO_MARKERS) {
    const idx = normalizedRaw.lastIndexOf(marker);
    if (idx > bestMarkerIndex) {
      bestMarkerIndex = idx;
    }
  }
  if (bestMarkerIndex >= 0) {
    const fromMarker = normalizedRaw.slice(bestMarkerIndex + 1);
    return joinLocalPath(root, fromMarker);
  }

  return null;
}

/** True when the traceback path refers to this monorepo (independent of editor link mapping). */
export function isNativeTracePath(rawPath: string): boolean {
  const normalized = normalizeSlashes(rawPath);
  if (normalized.startsWith(LAMBDA_TASK_PREFIX)) return true;
  return REPO_MARKERS.some((marker) => normalized.includes(marker));
}

/** Classify a traceback file path as native application code vs external dependency/stdlib. */
export function classifyTracePathScope(
  rawPath: string,
  settings: EditorLinkSettings
): TraceFrameScope {
  if (mapTracePathToLocal(rawPath, settings.localRepoRoot) != null) {
    return 'native';
  }
  return isNativeTracePath(rawPath) ? 'native' : 'external';
}

/** Classify a parsed frame as native application code vs external dependency/stdlib. */
export function classifyTraceFrameScope(
  frame: ParsedStackTraceFrameLine,
  settings: EditorLinkSettings
): TraceFrameScope {
  return classifyTracePathScope(frame.rawPath, settings);
}

export function isNativeTraceFrame(
  frame: ParsedStackTraceFrameLine,
  settings: EditorLinkSettings
): boolean {
  return classifyTraceFrameScope(frame, settings) === 'native';
}

export function isExternalTraceFrame(
  frame: ParsedStackTraceFrameLine,
  settings: EditorLinkSettings
): boolean {
  return classifyTraceFrameScope(frame, settings) === 'external';
}

/**
 * Group parsed traceback lines for rendering: contiguous external frames become one collapsible segment.
 */
export function groupStackTraceLines(
  lines: ParsedStackTraceLine[],
  settings: EditorLinkSettings
): StackTraceRenderSegment[] {
  const segments: StackTraceRenderSegment[] = [];
  let externalBuffer: ParsedStackTraceFrameLine[] = [];
  let externalStartIndex = -1;
  let externalGroupCount = 0;

  const flushExternal = () => {
    if (externalBuffer.length === 0) return;
    segments.push({
      kind: 'externalGroup',
      groupIndex: externalGroupCount,
      startLineIndex: externalStartIndex,
      frames: externalBuffer,
    });
    externalGroupCount += 1;
    externalBuffer = [];
    externalStartIndex = -1;
  };

  lines.forEach((line, lineIndex) => {
    if (line.kind === 'frame' && isExternalTraceFrame(line, settings)) {
      if (externalBuffer.length === 0) {
        externalStartIndex = lineIndex;
      }
      externalBuffer.push(line);
      return;
    }
    flushExternal();
    segments.push({ kind: 'line', lineIndex, line });
  });

  flushExternal();
  return segments;
}

function pathForEditorUri(localAbsPath: string): string {
  return normalizeSlashes(localAbsPath);
}

/** Build a `cursor://` or `vscode://` file URI, or null when linking is disabled or path is empty. */
export function buildEditorUri(
  localAbsPath: string,
  line: number,
  protocol: EditorProtocol
): string | null {
  if (protocol === 'none' || !localAbsPath.trim()) return null;
  const pathPart = encodeURI(pathForEditorUri(localAbsPath));
  return `${protocol}://file/${pathPart}:${line}`;
}

export type TraceFrameScope = 'native' | 'external';

export interface ParsedStackTraceFrameLine {
  kind: 'frame';
  prefix: string;
  rawPath: string;
  middle: string;
  lineNumber: number;
  suffix: string;
  href: string | null;
  /** Whether this frame is application code vs third-party/stdlib. */
  frameScope: TraceFrameScope;
}

export interface StackTraceVisibleSegment {
  kind: 'line';
  /** Index in the original parsed line array. */
  lineIndex: number;
  line: ParsedStackTraceLine;
}

export interface StackTraceExternalGroupSegment {
  kind: 'externalGroup';
  /** Stable index among external groups in this trace. */
  groupIndex: number;
  /** First line index in the original parsed array. */
  startLineIndex: number;
  frames: ParsedStackTraceFrameLine[];
}

export type StackTraceRenderSegment = StackTraceVisibleSegment | StackTraceExternalGroupSegment;

export interface ParsedStackTracePlainLine {
  kind: 'plain';
  text: string;
}

export type ParsedStackTraceLine = ParsedStackTraceFrameLine | ParsedStackTracePlainLine;

export interface EditorLinkSettings {
  localRepoRoot: string;
  protocol: EditorProtocol;
}

/** Parse one traceback line; frame lines include an optional editor href when mappable. */
export function parseStackTraceLine(
  line: string,
  settings: EditorLinkSettings
): ParsedStackTraceLine {
  const match = PYTHON_FRAME_RE.exec(line);
  if (!match) {
    return { kind: 'plain', text: line };
  }

  const [, prefix, rawPath, middle, lineStr, suffix] = match;
  const lineNumber = Number.parseInt(lineStr, 10);
  const localPath = mapTracePathToLocal(rawPath, settings.localRepoRoot);
  const href =
    localPath != null && Number.isFinite(lineNumber)
      ? buildEditorUri(localPath, lineNumber, settings.protocol)
      : null;

  return {
    kind: 'frame',
    prefix,
    rawPath,
    middle,
    lineNumber,
    suffix,
    href,
    frameScope: classifyTracePathScope(rawPath, settings),
  };
}

/** Parse a full stack trace string into per-line segments for rendering. */
export function parseStackTrace(
  text: string,
  settings: EditorLinkSettings
): ParsedStackTraceLine[] {
  if (!text) return [];
  const lines = text.split('\n');
  const parsed = lines.map((line) => parseStackTraceLine(line, settings));
  return parsed;
}
