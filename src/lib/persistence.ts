/**
 * ============================================================================
 * FASE 2.4: ALMACENAMIENTO EN CACHÉ (PERSISTENCIA)
 * ============================================================================
 * Persiste el catálogo y el estado de la radio en localStorage
 * como fallback de Vercel KV en entorno serverless.
 */

import { Catalog } from './audius';

const CATALOG_KEY = 'radio-catalog';
const STATE_KEY = 'radio-state';
const PLAYED_KEY = 'radio-played-ids';

/**
 * Guarda el catálogo en localStorage
 */
export function saveCatalog(catalog: Catalog): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  } catch (e) {
    console.warn('[Persistence] No se pudo guardar catálogo:', e);
  }
}

/**
 * Carga el catálogo desde localStorage
 */
export function loadCatalog(): Catalog | null {
  try {
    const stored = localStorage.getItem(CATALOG_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Catalog;
  } catch {
    return null;
  }
}

/**
 * Guarda el estado de reproducción (para reanudar tras reinicios)
 */
export function saveRadioState(state: {
  volume: number;
  ttsEnabled: boolean;
  lastTrackId?: string;
}): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    // Silenciar error
  }
}

/**
 * Carga el estado de reproducción
 */
export function loadRadioState(): {
  volume: number;
  ttsEnabled: boolean;
  lastTrackId?: string;
} | null {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Guarda los IDs de pistas ya reproducidas
 */
export function savePlayedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(PLAYED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Silenciar
  }
}

/**
 * Carga los IDs de pistas ya reproducidas
 */
export function loadPlayedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(PLAYED_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

/**
 * Limpia toda la persistencia
 */
export function clearPersistence(): void {
  localStorage.removeItem(CATALOG_KEY);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(PLAYED_KEY);
}
