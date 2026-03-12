import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAGNOSTICS_STORAGE_KEY = 'homebox_diagnostics';
const MAX_DIAGNOSTIC_EVENTS = 100;

export interface DiagnosticEvent {
  id: string;
  level: 'warn' | 'error';
  message: string;
  context?: unknown;
  timestamp: string;
}

class DiagnosticsService {
  private writeQueue: Promise<void> = Promise.resolve();

  record(level: 'warn' | 'error', message: string, context?: unknown): void {
    const event: DiagnosticEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.writeQueue = this.writeQueue
      .then(async () => {
        const existing = await this.getEvents();
        const nextEvents = [...existing, event].slice(-MAX_DIAGNOSTIC_EVENTS);
        await AsyncStorage.setItem(
          DIAGNOSTICS_STORAGE_KEY,
          JSON.stringify(nextEvents),
        );
      })
      .catch(() => undefined);
  }

  async getEvents(): Promise<DiagnosticEvent[]> {
    try {
      const rawValue = await AsyncStorage.getItem(DIAGNOSTICS_STORAGE_KEY);

      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DIAGNOSTICS_STORAGE_KEY);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

export const diagnosticsService = new DiagnosticsService();
