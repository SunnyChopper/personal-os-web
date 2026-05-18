import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEffect, useRef } from 'react';
import { useTextareaLineOffsets } from './UseTextareaLineOffsets';

function Probe({ value, enabled }: { value: string; enabled: boolean }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { apiRef, MirrorLayer } = useTextareaLineOffsets(taRef, value, enabled);

  useEffect(() => {
    const el = document.getElementById('probe-out');
    if (!el) return;
    const api = apiRef.current;
    el.textContent = api ? `${api.getLineAtOffset(0)}|${api.getOffsetTopForLine(1)}` : 'no-api';
  });

  return (
    <div className="relative w-80">
      <textarea
        id="ta-probe"
        ref={taRef}
        readOnly
        value={value}
        className="box-border h-[120px] w-full"
      />
      {MirrorLayer}
      <span id="probe-out" />
    </div>
  );
}

describe('useTextareaLineOffsets', () => {
  it('returns no mirror when disabled', () => {
    const { container } = render(<Probe value="a\nb" enabled={false} />);
    expect(container.querySelector('[data-line]')).toBeNull();
  });

  it('exposes api that maps line 1 at offset 0 under jsdom', async () => {
    const { container } = render(<Probe value="hi" enabled />);
    await waitFor(() => {
      const out = container.querySelector('#probe-out');
      expect(out?.textContent).toMatch(/^1\|/);
    });
  });
});
