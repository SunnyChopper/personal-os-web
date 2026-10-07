export type TemplateBodySegment = {
  label: string;
  body: string;
};

export type TemplateBodyStructure = {
  kind: 'thread' | 'sections' | 'beats';
  segments: TemplateBodySegment[];
};

const THREAD_START_RE = /^\s*(?:TWEET\s+(\d+)|(\d+)\s*\/)\s*[:\-—]?\s*(.*)$/i;
const SECTION_START_RE = /^\s{0,3}(#{1,3})\s+(.+)$/;
const BEAT_START_RE = /^\s*\[([^\]]+)\]\s*$/;

function normalizeLines(body: string): string[] {
  return body.replace(/\r\n/g, '\n').split('\n');
}

function trimBody(lines: string[]): string {
  return lines.join('\n').trim();
}

function parseThreadSegments(lines: string[]): TemplateBodySegment[] | null {
  const segments: TemplateBodySegment[] = [];
  let currentLabel = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentLabel) return;
    segments.push({ label: currentLabel, body: trimBody(currentBody) });
    currentBody = [];
  };

  for (const line of lines) {
    const match = line.match(THREAD_START_RE);
    if (match) {
      flush();
      const tweetNum = match[1] ?? match[2];
      const inlineBody = match[3]?.trim() ?? '';
      currentLabel = `Tweet ${tweetNum}`;
      currentBody = inlineBody ? [inlineBody] : [];
      continue;
    }
    if (currentLabel) {
      currentBody.push(line);
    }
  }
  flush();

  return segments.length >= 2 ? segments : null;
}

function parseSectionSegments(lines: string[]): TemplateBodySegment[] | null {
  const segments: TemplateBodySegment[] = [];
  let currentLabel = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentLabel) return;
    segments.push({ label: currentLabel, body: trimBody(currentBody) });
    currentBody = [];
  };

  for (const line of lines) {
    const match = line.match(SECTION_START_RE);
    if (match) {
      flush();
      currentLabel = match[2].trim();
      currentBody = [];
      continue;
    }
    if (currentLabel) {
      currentBody.push(line);
    }
  }
  flush();

  return segments.length >= 2 ? segments : null;
}

function parseBeatSegments(lines: string[]): TemplateBodySegment[] | null {
  const segments: TemplateBodySegment[] = [];
  let currentLabel = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentLabel) return;
    segments.push({ label: currentLabel, body: trimBody(currentBody) });
    currentBody = [];
  };

  for (const line of lines) {
    const match = line.match(BEAT_START_RE);
    if (match) {
      flush();
      currentLabel = match[1].trim();
      currentBody = [];
      continue;
    }
    if (currentLabel) {
      currentBody.push(line);
    }
  }
  flush();

  return segments.length >= 2 ? segments : null;
}

/** Parse known template body patterns into labeled segments for structured preview. */
export function parseTemplateBodyStructure(body: string): TemplateBodyStructure | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const lines = normalizeLines(trimmed);

  const thread = parseThreadSegments(lines);
  if (thread) return { kind: 'thread', segments: thread };

  const sections = parseSectionSegments(lines);
  if (sections) return { kind: 'sections', segments: sections };

  const beats = parseBeatSegments(lines);
  if (beats) return { kind: 'beats', segments: beats };

  return null;
}
