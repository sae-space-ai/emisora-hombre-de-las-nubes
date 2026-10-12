/**
 * FASE 3: Programador de Anuncios (Ad Scheduler)
 * Decide CUÁNDO y QUÉ anuncio se reproduce
 */

import advertisersData from '../data/advertisers.json';

// Configuración hardcoded (antes venía de adConfig.json)
const AD_CONFIG = {
  adIntervalSeconds: 10,
  adMinDurationSeconds: 10,
  adMaxDurationSeconds: 30,
  enableDucking: true,
  duckingLevel: 0.2,
  duckingFadeSeconds: 0.5,
  playAdAtStart: false,
  playAdAtEnd: false,
  enableAds: true,
  maxAdsPerTrack: Number.MAX_SAFE_INTEGER
};

export interface Advertiser {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  since?: string;
  description: string;
  adScript: string;
  audioFile: string | null;
  ttsVoice: string;
  duration: number;
  enabled: boolean;
  sponsored?: boolean;
}

class AdScheduler {
  private advertisers: Advertiser[] = [];
  private history: string[] = []; // Historial de IDs reproducidos
  private rotation: Advertiser[] = [];
  private lastAdId: string | null = null;
  private currentPlayTime = 0; // Tiempo de reproducción musical acumulado
  private nextAdTime = 0; // Tiempo en el que se debe reproducir el siguiente anuncio
  private adPlayCount = 0; // Contador de anuncios reproducidos en la pista actual
  private adInterval = AD_CONFIG.adIntervalSeconds;

  constructor() {
    this.loadAdvertisers();
  }

  /**
   * Carga los anunciantes desde el JSON
   */
  private loadAdvertisers(): void {
    this.advertisers = advertisersData.filter(ad => ad.enabled);
    console.log(`[AdScheduler] ${this.advertisers.length} anunciantes cargados`);
  }

  /**
   * Obtiene el siguiente anuncio usando rotación inteligente
   * Evita repetir el mismo anuncio dos veces seguidas
   */
  getNextAd(): Advertiser | null {
    const enabled = this.advertisers.filter(ad => ad.enabled);
    if (enabled.length === 0) return null;

    // Baraja sin reposición: todos los negocios aparecen una vez antes de repetir.
    if (this.rotation.length === 0) {
      this.rotation = [...enabled];
      for (let i = this.rotation.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.rotation[i], this.rotation[j]] = [this.rotation[j], this.rotation[i]];
      }
      if (this.rotation.length > 1 && this.rotation[0].id === this.lastAdId) {
        [this.rotation[0], this.rotation[1]] = [this.rotation[1], this.rotation[0]];
      }
    }
    const selected = this.rotation.shift()!;
    this.lastAdId = selected.id;
    this.history.push(selected.id);
    if (this.history.length > 5) this.history.shift();
    return selected;
  }

  /**
   * Verifica si es momento de reproducir un anuncio durante la pista
   * @param currentTime - Tiempo actual de reproducción en segundos
   * @param nextAdTime - Tiempo programado para el próximo anuncio
   */
  shouldPlayAdDuringTrack(currentTime: number, nextAdTime: number): boolean {
    if (!AD_CONFIG.enableAds) return false;
    if (this.adPlayCount >= AD_CONFIG.maxAdsPerTrack) return false;

    // CRÍTICO: Usar comparación >= en lugar de módulo
    if (currentTime >= nextAdTime && nextAdTime > 0) {
      console.log(`[AdScheduler] ✅ Momento de anuncio en ${currentTime}s (next: ${nextAdTime}s)`);
      return true;
    }

    return false;
  }

  /**
   * Resetea el temporizador para el siguiente anuncio
   */
  resetAdTimer(currentTime: number): void {
    this.nextAdTime = currentTime + this.adInterval;
    this.adPlayCount++;
    console.log(`[AdScheduler] Próximo anuncio en ${this.nextAdTime}s (count: ${this.adPlayCount})`);
  }

  /**
   * Verifica si se debe reproducir un anuncio al inicio de la pista
   */
  shouldPlayAdAtStart(): boolean {
    return AD_CONFIG.enableAds && AD_CONFIG.playAdAtStart;
  }

  /**
   * Verifica si se debe reproducir un anuncio al final de la pista
   */
  shouldPlayAdAtEnd(): boolean {
    return AD_CONFIG.enableAds && AD_CONFIG.playAdAtEnd;
  }

  /**
   * Resetea el estado para una nueva pista
   */
  resetForNewTrack(): void {
    this.currentPlayTime = 0;
    this.nextAdTime = this.adInterval; // Primer anuncio durante la pista
    this.adPlayCount = 0;
    console.log('[AdScheduler] Reset para nueva pista');
  }

  /**
   * Actualiza el tiempo de reproducción actual
   */
  updatePlayTime(currentTime: number): void {
    this.currentPlayTime = currentTime;
  }

  /**
   * Obtiene todos los anunciantes
   */
  getAllAdvertisers(): Advertiser[] {
    return this.advertisers;
  }

  /**
   * Obtiene estadísticas
   */
  getStats(): {
    totalAdvertisers: number;
    adsPlayedInTrack: number;
    historyLength: number;
  } {
    return {
      totalAdvertisers: this.advertisers.length,
      adsPlayedInTrack: this.adPlayCount,
      historyLength: this.history.length,
    };
  }

  /**
   * Configura el intervalo de anuncios
   */
  setAdInterval(seconds: number): void {
    this.adInterval = seconds;
    console.log(`[AdScheduler] Intervalo configurado: ${seconds}s`);
  }

  /**
   * Habilita/deshabilita un anunciante
   */
  toggleAdvertiser(id: string, enabled: boolean): void {
    const advertiser = this.advertisers.find(ad => ad.id === id);
    if (advertiser) {
      advertiser.enabled = enabled;
      this.rotation = [];
      console.log(`[AdScheduler] Anunciante ${id} ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }
  }
}

// Exportar instancia singleton
export const adScheduler = new AdScheduler();
