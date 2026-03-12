const isDevelopment = __DEV__;
import {diagnosticsService} from '../services/diagnosticsService';
import {LogContext, sanitizeForLogging} from './logSanitizer';

const recordDiagnostic = (
  level: 'warn' | 'error',
  message: string,
  context?: LogContext,
) => {
  diagnosticsService.record(level, message, sanitizeForLogging(context));
};

export const logger = {
  log: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.log(message, sanitized);
    }
  },

  error: (message: string, context?: LogContext): void => {
    recordDiagnostic('error', message, context);

    if (isDevelopment) {
      const sanitized = context ? sanitizeForLogging(context) : undefined;
      console.error(message, sanitized);
    }
  },

  warn: (message: string, context?: LogContext): void => {
    recordDiagnostic('warn', message, context);

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
