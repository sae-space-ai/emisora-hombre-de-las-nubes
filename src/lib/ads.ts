/**
 * Sistema de Gestión de Publicidad Dinámica
 * Inserta anuncios de empresas locales de Almendralejo cada 30 segundos
 * Implementa rotación inteligente y audio ducking
 */

import advertisersData from '../data/advertisers.json';

export interface Advertiser {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  since?: string;
  description: string;
  adScript: string;
  audioFile: string | null;
  ttsVoice: string;
  duration: number;
}

export interface AdState {
  currentAd: Advertiser | null;
  isPlayingAd: boolean;
  adsPlayed: string[];
  lastAdTime: number;
  originalVolume: number;
}

// Configuración del sistema de publicidad
const AD_CONFIG = {
  interval: 30000, // 30 segundos entre anuncios
  duckingVolume: 0.2, // Volumen de música durante anuncio (20%)
  fadeInDuration: 500, // ms para fade in/out
  enableAds: true, // Master switch
};

// Estado global del sistema de publicidad
let adState: AdState = {
  currentAd: null,
  isPlayingAd: false,
  adsPlayed: [],
  lastAdTime: 0,
  originalVolume: 0.8,
};

// Callbacks para notificar cambios de estado
let onAdStartCallback: ((ad: Advertiser) => void) | null = null;
let onAdEndCallback: (() => void) | null = null;

/**
 * Obtiene todos los anunciantes
 */
export function getAllAdvertisers(): Advertiser[] {
  return advertisersData as Advertiser[];
}

/**
 * Obtiene un anunciante por ID
 */
export function getAdvertiserById(id: string): Advertiser | null {
  return advertisersData.find((ad) => ad.id === id) || null;
}

/**
 * Obtiene el siguiente anuncio usando rotación inteligente
 * Evita repetir el mismo anuncio consecutivamente
 */
export function getNextAdvertiser(): Advertiser {
  const allAds = getAllAdvertisers();
  
  if (allAds.length === 0) {
    throw new Error('No hay anunciantes disponibles');
  }

  // Si solo hay un anuncio, devolverlo siempre
  if (allAds.length === 1) {
    return allAds[0];
  }

  // Filtrar anuncios que no se hayan reproducido recientemente
  const availableAds = allAds.filter(
    (ad) => !adState.adsPlayed.includes(ad.id)
  );

  // Si todos se han reproducido, resetear el historial
  const pool = availableAds.length > 0 ? availableAds : allAds;

  // Seleccionar aleatoriamente
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedAd = pool[randomIndex];

  // Actualizar historial (mantener últimos 5 para evitar repetición inmediata)
  adState.adsPlayed.push(selectedAd.id);
  if (adState.adsPlayed.length > 5) {
    adState.adsPlayed.shift();
  }

  return selectedAd;
}

/**
 * Verifica si es momento de reproducir un anuncio
 */
export function shouldPlayAd(): boolean {
  if (!AD_CONFIG.enableAds) return false;
  
  const now = Date.now();
  const timeSinceLastAd = now - adState.lastAdTime;
  
  return timeSinceLastAd >= AD_CONFIG.interval;
}

/**
 * Inicia la reproducción de un anuncio con audio ducking
 */
export async function startAd(
  audioElement: HTMLAudioElement,
  onEnd: () => void
): Promise<void> {
  const ad = getNextAdvertiser();
  
  adState.currentAd = ad;
  adState.isPlayingAd = true;
  adState.lastAdTime = Date.now();
  adState.originalVolume = audioElement.volume;

  // Notificar inicio del anuncio
  if (onAdStartCallback) {
    onAdStartCallback(ad);
  }

  // Audio ducking: bajar volumen de la música
  await fadeVolume(audioElement, adState.originalVolume, AD_CONFIG.duckingVolume, AD_CONFIG.fadeInDuration);

  // Reproducir anuncio con TTS
  await speakAd(ad, async () => {
    // Restaurar volumen de la música
    await fadeVolume(audioElement, AD_CONFIG.duckingVolume, adState.originalVolume, AD_CONFIG.fadeInDuration);
    
    adState.isPlayingAd = false;
    adState.currentAd = null;

    // Notificar fin del anuncio
    if (onAdEndCallback) {
      onAdEndCallback();
    }

    onEnd();
  });
}

/**
 * Reproduce el script del anuncio usando TTS
 */
async function speakAd(ad: Advertiser, onEnd: () => void): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[ADS] Speech Synthesis no disponible');
    onEnd();
    return;
  }

  // Cancelar cualquier locución previa
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(ad.adScript);
  
  // Configurar voz
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Buscar voz en español
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(
    (v) => v.lang === 'es-ES' || v.lang.startsWith('es-')
  );
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = () => {
    console.error('[ADS] Error reproduciendo anuncio');
    onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Fade in/out del volumen del audio
 */
function fadeVolume(
  audioElement: HTMLAudioElement,
  fromVolume: number,
  toVolume: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (toVolume - fromVolume) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audioElement.volume = Math.max(0, Math.min(1, fromVolume + volumeStep * currentStep));

      if (currentStep >= steps) {
        clearInterval(interval);
        audioElement.volume = toVolume;
        resolve();
      }
    }, stepDuration);
  });
}

/**
 * Obtiene el estado actual del sistema de publicidad
 */
export function getAdState(): AdState {
  return { ...adState };
}

/**
 * Registra callback para inicio de anuncio
 */
export function onAdStart(callback: (ad: Advertiser) => void): void {
  onAdStartCallback = callback;
}

/**
 * Registra callback para fin de anuncio
 */
export function onAdEnd(callback: () => void): void {
  onAdEndCallback = callback;
}

/**
 * Habilita/deshabilita el sistema de publicidad
 */
export function setAdsEnabled(enabled: boolean): void {
  AD_CONFIG.enableAds = enabled;
}

/**
 * Configura el intervalo entre anuncios (en ms)
 */
export function setAdInterval(intervalMs: number): void {
  AD_CONFIG.interval = intervalMs;
}

/**
 * Obtiene estadísticas de publicidad
 */
export function getAdStats(): {
  totalAds: number;
  adsPlayed: number;
  lastAdTime: string | null;
} {
  return {
    totalAds: getAllAdvertisers().length,
    adsPlayed: adState.adsPlayed.length,
    lastAdTime: adState.lastAdTime > 0 
      ? new Date(adState.lastAdTime).toISOString() 
      : null,
  };
}
