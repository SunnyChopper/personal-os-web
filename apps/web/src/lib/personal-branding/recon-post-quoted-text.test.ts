import { describe, expect, it } from 'vitest';
import { splitReconPostQuotedText } from './recon-post-quoted-text';

describe('splitReconPostQuotedText', () => {
  it('splits on the ingest Quoted marker', () => {
    expect(
      splitReconPostQuotedText(
        'Primary tweet body here.\n\nQuoted:\nThis is the quoted tweet text.'
      )
    ).toEqual({
      primary: 'Primary tweet body here.',
      quoted: 'This is the quoted tweet text.',
    });
  });

  it('returns unsplit text when marker is absent', () => {
    expect(splitReconPostQuotedText('Plain post without a quote block.')).toEqual({
      primary: 'Plain post without a quote block.',
      quoted: null,
    });
  });

  it('does not split on inline Quoted: without the exact marker', () => {
    const text = 'Primary says Quoted: inline but not a block.';
    expect(splitReconPostQuotedText(text)).toEqual({
      primary: text,
      quoted: null,
    });
  });

  it('returns quoted-only when primary is empty', () => {
    expect(splitReconPostQuotedText('\n\nQuoted:\nQuoted body only.')).toEqual({
      primary: '',
      quoted: 'Quoted body only.',
    });
  });

  it('returns unsplit when marker has no quoted body', () => {
    const text = 'Primary only.\n\nQuoted:\n';
    expect(splitReconPostQuotedText(text)).toEqual({
      primary: text,
      quoted: null,
    });
  });
});
