const sensitiveKeys = [
  'password',
  'token',
  'authorization',
  'auth',
  'secret',
  'apikey',
  'api_key',
  'credentials',
  'cookie',
  'session',
  'bearer',
  'jwt',
  'privatekey',
  'private_key',
  'username',
  'host',
  'baseurl',
  'url',
];

const MAX_LOG_STRING_LENGTH = 512;

const sanitizeString = (value: string): string =>
  value
    .replace(/(https?:\/\/)([^\s/@:]+)(?::[^\s/@]*)?@/gi, '$1[REDACTED]@')
    .replace(
      /\b(password|token|secret|authorization|apikey|api_key|bearer)=([^\s&]+)/gi,
      '$1=[REDACTED]',
    )
    .slice(0, MAX_LOG_STRING_LENGTH);

export function sanitizeForLogging(data: unknown): unknown {
  if (data instanceof Error) {
    return {
      name: data.name,
      // Stack traces can contain request URLs, local paths, and user data.
      message: sanitizeString(data.message),
    };
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
}
