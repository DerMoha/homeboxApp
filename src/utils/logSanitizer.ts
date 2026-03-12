export type LogContext = Record<string, unknown>;

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
];

export function sanitizeForLogging(data: unknown): unknown {
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
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
