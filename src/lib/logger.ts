/**
 * ============================================================================
 * FASE 7: SISTEMA DE LOGS CON TIMESTAMP
 * ============================================================================
 * Rastrea: pistas reproducidas, errores de streaming, intervenciones TTS
 * y regeneraciones de cola.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'TTS' | 'TRACK' | 'QUEUE' | 'SYSTEM';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const MAX_LOG_ENTRIES = 500;
const LOG_STORAGE_KEY = 'radio-logs';

/**
 * Registra un evento con timestamp
 */
export function log(level: LogLevel, message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };

  // Console output con formato
  const prefix = `[${entry.timestamp}] [${level}]`;
  switch (level) {
    case 'ERROR':
      console.error(`${prefix} ${message}`, data || '');
      break;
    case 'WARN':
      console.warn(`${prefix} ${message}`, data || '');
      break;
    default:
      console.log(`${prefix} ${message}`, data || '');
  }

  // Persistir en localStorage
  try {
    const existing = getLogs();
    const updated = [...existing, entry].slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Si localStorage falla, no interrumpir la radio
  }
}

/**
 * Obtiene los logs almacenados
 */
export function getLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Limpia los logs
 */
export function clearLogs(): void {
  localStorage.removeItem(LOG_STORAGE_KEY);
}

// Shortcuts
export const logTrack = (msg: string, data?: any) => log('TRACK', msg, data);
export const logTTS = (msg: string, data?: any) => log('TTS', msg, data);
export const logQueue = (msg: string, data?: any) => log('QUEUE', msg, data);
export const logError = (msg: string, data?: any) => log('ERROR', msg, data);
export const logSystem = (msg: string, data?: any) => log('SYSTEM', msg, data);
