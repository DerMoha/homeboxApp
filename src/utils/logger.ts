/**
 * Simple logging utility for development and production
 * In production, only errors are logged
 * In development, all logs are shown
 */

const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you might want to send errors to a service like Sentry
    // For now, we just suppress them in production
  },

  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
