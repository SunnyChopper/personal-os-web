import { describe, expect, it, vi } from 'vitest';
import {
  readPreviewBlocks,
  syncPreviewScrollToTextarea,
  syncTextareaScrollToPreview,
} from './markdown-follow-scroll';
import type { TextareaLineOffsetsApi } from './UseTextareaLineOffsets';

function mockMirror(overrides: Partial<TextareaLineOffsetsApi> = {}): TextareaLineOffsetsApi {
  const lineToY: Record<number, number> = { 1: 0, 2: 20, 3: 40 };
  return {
    getOffsetTopForLine: (line: number) => lineToY[line] ?? 0,
    getLineAtOffset: (scrollTop: number) => (scrollTop >= 30 ? 3 : scrollTop >= 10 ? 2 : 1),
    getTotalHeight: () => 100,
    scheduleMeasure: () => {},
    ...overrides,
  };
}

describe('markdownFollowScroll', () => {
  it('readPreviewBlocks dedupes repeated line numbers and sorts', () => {
    const root = document.createElement('div');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const a = document.createElement('p');
    a.dataset.sourceLine = '2';
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue({
      top: 40,
      left: 0,
      bottom: 60,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect);

    const b = document.createElement('p');
    b.dataset.sourceLine = '2';
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue({
      top: 80,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 80,
      toJSON: () => ({}),
    } as DOMRect);

    root.append(a, b);
    const blocks = readPreviewBlocks(root);
    expect(blocks).toEqual([{ line: 2, top: 40 }]);
  });

  it('syncTextareaScrollToPreview sets preview scroll from textarea and mirror', () => {
    const ta = document.createElement('textarea');
    const pv = document.createElement('div');
    vi.spyOn(pv, 'scrollHeight', 'get').mockReturnValue(500);
    vi.spyOn(pv, 'clientHeight', 'get').mockReturnValue(100);
    ta.scrollTop = 15;
    const mirror = mockMirror();
    const blocks = [
      { line: 1, top: 0 },
      { line: 3, top: 200 },
    ];
    syncTextareaScrollToPreview(ta, pv, mirror, blocks);
    expect(pv.scrollTop).toBeGreaterThanOrEqual(0);
    expect(pv.scrollTop).toBeLessThanOrEqual(200);
  });

  it('syncPreviewScrollToTextarea maps preview scroll to textarea', () => {
    const ta = document.createElement('textarea');
    vi.spyOn(ta, 'clientHeight', 'get').mockReturnValue(50);
    const pv = document.createElement('div');
    vi.spyOn(pv, 'scrollHeight', 'get').mockReturnValue(300);
    vi.spyOn(pv, 'clientHeight', 'get').mockReturnValue(100);
    pv.scrollTop = 50;
    const mirror = mockMirror();
    const blocks = [
      { line: 1, top: 0 },
      { line: 2, top: 100 },
    ];
    syncPreviewScrollToTextarea(ta, pv, mirror, blocks);
    expect(ta.scrollTop).toBeGreaterThanOrEqual(0);
  });
});
