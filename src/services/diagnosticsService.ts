import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAGNOSTICS_STORAGE_KEY = 'homebox_diagnostics';
const MAX_DIAGNOSTIC_EVENTS = 100;
const EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type DiagnosticLevel = 'warn' | 'error';

export interface DiagnosticEvent {
  id: string;
  level: DiagnosticLevel;
  message: string;
  context?: unknown;
  timestamp: string;
}

class DiagnosticsService {
  private writeQueue: Promise<void> = Promise.resolve();

  private enqueueWrite(event: DiagnosticEvent): void {
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

  record(level: DiagnosticLevel, message: string, context?: unknown): void {
    const event: DiagnosticEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.enqueueWrite(event);
  }

  async getEvents(): Promise<DiagnosticEvent[]> {
    try {
      const rawValue = await AsyncStorage.getItem(DIAGNOSTICS_STORAGE_KEY);

      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) {
        return [];
      }

      const cutoff = Date.now() - EVENT_TTL_MS;
      const fresh = parsedValue.filter(
        (e: DiagnosticEvent) => new Date(e.timestamp).getTime() > cutoff,
      );

      // Persist the pruned list if stale events were removed
      if (fresh.length < parsedValue.length) {
        await AsyncStorage.setItem(
          DIAGNOSTICS_STORAGE_KEY,
          JSON.stringify(fresh),
        ).catch(() => undefined);
      }

      return fresh;
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
