const REDACTED = '[REDACTED]';
const CIRCULAR_REF = '[Circular]';
const MAX_DEPTH_VALUE = '[MaxDepth]';

const sensitiveKeyFragments = [
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'authorization',
  'apiKey',
  'apikey',
  'secret',
  'password',
  'cookie',
  'session',
];

const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const bearerPattern = /Bearer\s+[A-Za-z0-9._-]+/g;

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return sensitiveKeyFragments.some((fragment) => lower.includes(fragment.toLowerCase()));
}

function sanitizeString(value: string): string {
  if (jwtPattern.test(value.trim())) {
    return REDACTED;
  }
  if (value.includes('Bearer ')) {
    return value.replace(bearerPattern, 'Bearer [REDACTED]');
  }
  return value;
}

type SanitizeOptions = {
  maxDepth?: number;
};

export function sanitizeForSnapshot(value: unknown, options: SanitizeOptions = {}): unknown {
  const maxDepth = options.maxDepth ?? 6;
  const seen = new WeakMap<object, unknown>();

  const walk = (input: unknown, depth: number): unknown => {
    if (depth > maxDepth) {
      return MAX_DEPTH_VALUE;
    }

    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return sanitizeString(input);
    }

    if (typeof input !== 'object') {
      return input;
    }

    const obj = input as Record<string, unknown>;
    if (seen.has(obj)) {
      return CIRCULAR_REF;
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (input instanceof Map) {
      seen.set(obj, true);
      return Array.from(input.entries()).map(([key, value]) => [
        walk(key, depth + 1),
        walk(value, depth + 1),
      ]);
    }

    if (input instanceof Set) {
      seen.set(obj, true);
      return Array.from(input.values()).map((value) => walk(value, depth + 1));
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: input.message,
        stack: input.stack,
      };
    }

    if (Array.isArray(input)) {
      seen.set(obj, true);
      return input.map((item) => walk(item, depth + 1));
    }

    seen.set(obj, true);
    const output: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (isSensitiveKey(key)) {
        output[key] = REDACTED;
      } else {
        output[key] = walk(value, depth + 1);
      }
    });
    return output;
  };

  return walk(value, 0);
}
