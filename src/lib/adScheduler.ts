/**
 * FASE 3: Programador de Anuncios (Ad Scheduler)
 * Decide CUÁNDO y QUÉ anuncio se reproduce
 */

import advertisersData from '../data/advertisers.json';
import adConfig from '../data/adConfig.json';

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
}

class AdScheduler {
  private advertisers: Advertiser[] = [];
  private history: string[] = []; // Historial de IDs reproducidos
  private currentPlayTime = 0; // Tiempo de reproducción musical acumulado
  private nextAdTime = 0; // Tiempo en el que se debe reproducir el siguiente anuncio
  private adPlayCount = 0; // Contador de anuncios reproducidos en la pista actual
  private adInterval = adConfig.adIntervalSeconds;

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
    if (this.advertisers.length === 0) {
      console.warn('[AdScheduler] No hay anunciantes disponibles');
      return null;
    }

    // Filtrar anunciantes que no estén en el historial reciente
    const availableAds = this.advertisers.filter(
      ad => !this.history.includes(ad.id)
    );

    // Si todos están en el historial, resetear
    const pool = availableAds.length > 0 ? availableAds : this.advertisers;

    // Seleccionar aleatoriamente
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedAd = pool[randomIndex];

    // Actualizar historial (mantener últimos 5)
    this.history.push(selectedAd.id);
    if (this.history.length > 5) {
      this.history.shift();
    }

    console.log(`[AdScheduler] Siguiente anuncio: ${selectedAd.name}`);
    return selectedAd;
  }

  /**
   * Verifica si es momento de reproducir un anuncio durante la pista
   * @param currentTime - Tiempo actual de reproducción en segundos
   */
  shouldPlayAdDuringTrack(currentTime: number): boolean {
    if (!adConfig.enableAds) return false;
    if (this.adPlayCount >= adConfig.maxAdsPerTrack) return false;

    if (currentTime >= this.nextAdTime) {
      console.log(`[AdScheduler] Momento de anuncio en ${currentTime}s (next: ${this.nextAdTime}s)`);
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
    return adConfig.enableAds && adConfig.playAdAtStart;
  }

  /**
   * Verifica si se debe reproducir un anuncio al final de la pista
   */
  shouldPlayAdAtEnd(): boolean {
    return adConfig.enableAds && adConfig.playAdAtEnd;
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
      console.log(`[AdScheduler] Anunciante ${id} ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }
  }
}

// Exportar instancia singleton
export const adScheduler = new AdScheduler();
