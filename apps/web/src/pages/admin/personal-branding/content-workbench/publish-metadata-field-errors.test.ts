import { describe, expect, it } from 'vitest';
import {
  CANONICAL_URL_MAX_LENGTH,
  clientCanonicalUrlError,
  isValidCanonicalUrl,
  publishMetadataFieldErrors,
} from './publish-metadata-field-errors';

describe('publishMetadataFieldErrors', () => {
  it('reads backend fields map from error.details', () => {
    const error = {
      message: 'Publishing requires valid platform and canonical URL',
      details: {
        requestId: 'req-1',
        fields: {
          platform: 'Original platform is required when publishing.',
          canonicalUrl: 'Canonical URL is required when publishing.',
        },
      },
    };
    expect(publishMetadataFieldErrors(error)).toEqual({
      platform: 'Original platform is required when publishing.',
      canonicalUrl: 'Canonical URL is required when publishing.',
    });
  });

  it('falls back to Pydantic loc/msg array entries', () => {
    const error = {
      details: [
        {
          loc: ['body', 'canonicalUrl'],
          msg: 'String should have at most 2000 characters',
        },
      ],
    };
    expect(publishMetadataFieldErrors(error)).toEqual({
      canonicalUrl: 'String should have at most 2000 characters',
    });
  });
});

describe('clientCanonicalUrlError', () => {
  it('flags over-max length before touch blur', () => {
    const long = `https://example.com/${'a'.repeat(CANONICAL_URL_MAX_LENGTH)}`;
    expect(clientCanonicalUrlError(long, false)).toMatch(/at most 2000/);
  });

  it('validates scheme when touched', () => {
    expect(clientCanonicalUrlError('ftp://example.com', true)).toMatch(/http/);
  });
});

describe('isValidCanonicalUrl', () => {
  it('accepts http(s) within max length', () => {
    expect(isValidCanonicalUrl('https://medium.com/@user/post')).toBe(true);
  });

  it('rejects over-max length', () => {
    const long = `https://example.com/${'a'.repeat(CANONICAL_URL_MAX_LENGTH)}`;
    expect(isValidCanonicalUrl(long)).toBe(false);
  });
});
