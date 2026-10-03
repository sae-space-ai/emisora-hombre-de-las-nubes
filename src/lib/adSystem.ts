/**
 * Sistema de Publicidad Simple y Unificado
 * 
 * CARACTERÍSTICAS:
 * - Anuncio al inicio de cada pista
 * - Anuncio cada 10 segundos de música acumulada
 * - Anuncio al final de cada pista
 * - Usa TTS (Text-to-Speech) para los anuncios
 * - Sin archivos de audio externos
 * - Integrado directamente en el motor de reproducción
 */

import { Advertiser, adScheduler } from './adScheduler';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const AD_INTERVAL_SECONDS = 10; // Anuncio cada 10 segundos de música

// ============================================================================
// TIPOS
// ============================================================================

export type AdPosition = 'start' | 'middle' | 'end';

export interface AdEvent {
  position: AdPosition;
  advertiser: Advertiser;
  timestamp: number;
}

// ============================================================================
// ESTADO DEL SISTEMA
// ============================================================================

let accumulatedMusicTime = 0;
let lastAdTime = 0;
let isAdPlaying = false;
let adHistory: AdEvent[] = [];

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Verifica si debe reproducir un anuncio intermedio
 */
export function shouldPlayMiddleAd(): boolean {
  if (isAdPlaying) return false;
  
  const timeSinceLastAd = accumulatedMusicTime - lastAdTime;
  return timeSinceLastAd >= AD_INTERVAL_SECONDS;
}

/**
 * Actualiza el tiempo acumulado de música
 */
export function updateAccumulatedTime(seconds: number): void {
  accumulatedMusicTime = seconds;
}

/**
 * Resetea el tiempo acumulado después de un anuncio
 */
export function resetAccumulatedTime(): void {
  lastAdTime = accumulatedMusicTime;
}

/**
 * Obtiene el siguiente anuncio para la posición dada
 */
export function getNextAdForPosition(position: AdPosition): Advertiser | null {
  const advertiser = adScheduler.getNextAd();
  
  if (advertiser) {
    adHistory.push({
      position,
      advertiser,
      timestamp: Date.now(),
    });
    
    // Mantener solo los últimos 10 anuncios en el historial
    if (adHistory.length > 10) {
      adHistory.shift();
    }
  }
  
  return advertiser;
}

/**
 * Marca que un anuncio está en reproducción
 */
export function setAdPlaying(playing: boolean): void {
  isAdPlaying = playing;
}

/**
 * Verifica si un anuncio está en reproducción
 */
export function isAdCurrentlyPlaying(): boolean {
  return isAdPlaying;
}

/**
 * Obtiene las estadísticas del sistema de publicidad
 */
export function getAdStats(): {
  totalAdsPlayed: number;
  adsByPosition: Record<AdPosition, number>;
  accumulatedTime: number;
} {
  const adsByPosition: Record<AdPosition, number> = {
    start: 0,
    middle: 0,
    end: 0,
  };
  
  adHistory.forEach(ad => {
    adsByPosition[ad.position]++;
  });
  
  return {
    totalAdsPlayed: adHistory.length,
    adsByPosition,
    accumulatedTime: accumulatedMusicTime,
  };
}

/**
 * Resetea todo el estado del sistema
 */
export function resetAdSystem(): void {
  accumulatedMusicTime = 0;
  lastAdTime = 0;
  isAdPlaying = false;
  adHistory = [];
}

/**
 * Obtiene el tiempo acumulado actual
 */
export function getAccumulatedTime(): number {
  return accumulatedMusicTime;
}

/**
 * Obtiene el historial de anuncios
 */
export function getAdHistory(): AdEvent[] {
  return [...adHistory];
}
