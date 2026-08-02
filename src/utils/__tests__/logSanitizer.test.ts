import {sanitizeForLogging} from '../logSanitizer';

describe('sanitizeForLogging', () => {
  it('redacts sensitive fields and omits error stacks', () => {
    const sanitized = sanitizeForLogging({
      username: 'admin@example.com',
      host: 'https://user:password@example.com',
      error: new Error('Request failed token=secret'),
    }) as Record<string, unknown>;

    expect(sanitized.username).toBe('[REDACTED]');
    expect(sanitized.host).toBe('[REDACTED]');
    expect(sanitized.error).toEqual({
      name: 'Error',
      message: 'Request failed token=[REDACTED]',
    });
    expect(sanitized.error).not.toHaveProperty('stack');
  });

  it('limits arbitrary log strings', () => {
    const sanitized = sanitizeForLogging('a'.repeat(600));

    expect(sanitized).toHaveLength(512);
  });
});
