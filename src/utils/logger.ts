const isDevelopment = __DEV__;
import {diagnosticsService} from '../services/diagnosticsService';
import {sanitizeForLogging} from './logSanitizer';

type LogLevel = 'log' | 'info' | 'warn' | 'error';

const emitLog = (level: LogLevel, message: string, context?: unknown) => {
  const sanitized = context ? sanitizeForLogging(context) : undefined;

  if (level === 'warn' || level === 'error') {
    diagnosticsService.record(level, message, sanitized);
  }

  if (!isDevelopment) {
    return;
  }

  switch (level) {
    case 'error':
      console.error(message, sanitized);
      break;
    case 'warn':
      console.warn(message, sanitized);
      break;
    case 'info':
      console.info(message, sanitized);
      break;
    default:
      console.log(message, sanitized);
      break;
  }
};

export const logger = {
  log: (message: string, context?: unknown): void => {
    emitLog('log', message, context);
  },

  error: (message: string, context?: unknown): void => {
    emitLog('error', message, context);
  },

  warn: (message: string, context?: unknown): void => {
    emitLog('warn', message, context);
  },

  info: (message: string, context?: unknown): void => {
    emitLog('info', message, context);
  },
};
