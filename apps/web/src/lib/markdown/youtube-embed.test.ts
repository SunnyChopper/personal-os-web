import { describe, expect, it } from 'vitest';
import { parseYouTubeVideoId, toYouTubeEmbedSrc } from './youtube-embed';

describe('parseYouTubeVideoId', () => {
  it('parses watch URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=LPZh90jKq8s')).toEqual({
      videoId: 'LPZh90jKq8s',
    });
  });

  it('parses watch URLs with playlist', () => {
    expect(
      parseYouTubeVideoId(
        'https://www.youtube.com/watch?v=LPZh90jKq8s&list=PLZHQ0BOWTQDNUSa1_670DQX_ZC3B-3p1'
      )
    ).toEqual({
      videoId: 'LPZh90jKq8s',
      listId: 'PLZHQ0BOWTQDNUSa1_670DQX_ZC3B-3p1',
    });
  });

  it('parses youtu.be short links', () => {
    expect(parseYouTubeVideoId('https://youtu.be/abc123XYZ_-')).toEqual({
      videoId: 'abc123XYZ_-',
    });
  });

  it('parses shorts URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('parses embed URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('returns null for non-YouTube URLs', () => {
    expect(parseYouTubeVideoId('https://example.com/watch?v=abc')).toBeNull();
    expect(parseYouTubeVideoId('not-a-url')).toBeNull();
    expect(parseYouTubeVideoId('')).toBeNull();
  });
});

describe('toYouTubeEmbedSrc', () => {
  it('builds nocookie embed URL', () => {
    expect(toYouTubeEmbedSrc({ videoId: 'abc123' })).toBe(
      'https://www.youtube-nocookie.com/embed/abc123'
    );
  });

  it('includes playlist when present', () => {
    expect(toYouTubeEmbedSrc({ videoId: 'abc123', listId: 'PLtest' })).toBe(
      'https://www.youtube-nocookie.com/embed/abc123?list=PLtest'
    );
  });
});
