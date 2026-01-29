/**
 * Logger utility with automatic sensitive data redaction.
 * All log levels (log, error, warn, info) are suppressed in production.
 */

const isDevelopment = __DEV__;

export type LogContext = Record<string, any>;

function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

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

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  log: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.log(message, sanitized);
    }
  },

  error: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.error(message, sanitized);
    }
  },

  warn: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.warn(message, sanitized);
    }
  },

  info: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.info(message, sanitized);
    }
  },
};
