/**
 * Sistema Simple de Publicidad para Radio El Hombre de las Nubes
 * 
 * LÓGICA:
 * 1. Al pulsar Play: reproducir anuncio de bienvenida → música
 * 2. Cada 10 segundos de música acumulada: esperar fin de canción → anuncio → siguiente canción
 * 3. Al terminar sesión: reproducir anuncio de cierre
 * 4. Stop: detener sin anuncio
 * 
 * REQUISITOS:
 * - Una única cola de audio
 * - No reproducir música y publicidad simultáneamente
 * - No acumular anuncios pendientes
 * - Mantener orden de canciones
 * - Sin silencios innecesarios
 */

import adsConfig from '../../public/audio/ads/ads-config.json';

export interface AdInfo {
  id: string;
  name: string;
  file: string;
  duration: number;
}

export type PlaybackState = 'idle' | 'playing_ad' | 'playing_music' | 'paused' | 'stopped';

export interface AdPlayerCallbacks {
  onAdStart?: (ad: AdInfo) => void;
  onAdEnd?: (ad: AdInfo) => void;
  onMusicStart?: () => void;
  onMusicEnd?: () => void;
  onStateChange?: (state: PlaybackState) => void;
  onAccumulatedTimeUpdate?: (seconds: number) => void;
}

class AdPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private state: PlaybackState = 'idle';
  private callbacks: AdPlayerCallbacks = {};
  
  // Control de tiempo acumulado de música
  private accumulatedMusicTime = 0;
  private lastMusicStartTime = 0;
  private adInterval = adsConfig.config.adIntervalSeconds;
  
  // Cola de música (IDs de pistas)
  private musicQueue: string[] = [];
  private currentMusicIndex = 0;
  
  // Control de anuncios
  private currentAd: AdInfo | null = null;
  private middleAdIndex = 0;
  private adPending = false; // Evita acumular anuncios
  
  // URLs de streams de música (función para obtener URL de pista)
  private getMusicUrl: ((trackId: string) => string) | null = null;

  /**
   * Inicializa el reproductor de publicidad
   */
  initialize(
    audioElement: HTMLAudioElement,
    getMusicUrl: (trackId: string) => string,
    callbacks: AdPlayerCallbacks = {}
  ): void {
    this.audioElement = audioElement;
    this.getMusicUrl = getMusicUrl;
    this.callbacks = callbacks;

    // Configurar eventos del audio
    audioElement.addEventListener('ended', () => this.handleAudioEnded());
    audioElement.addEventListener('error', (e) => this.handleAudioError(e));

    console.log('[AdPlayer] ✅ Inicializado');
  }

  /**
   * Carga la lista de música
   */
  loadMusicQueue(trackIds: string[]): void {
    this.musicQueue = [...trackIds];
    this.currentMusicIndex = 0;
    console.log(`[AdPlayer] 📋 Cola de música cargada: ${trackIds.length} pistas`);
  }

  /**
   * INICIAR REPRODUCCIÓN (Play)
   * 1. Reproducir anuncio de bienvenida
   * 2. Al terminar, comenzar música
   */
  async play(): Promise<void> {
    if (!this.audioElement) {
      console.error('[AdPlayer] ❌ No inicializado');
      return;
    }

    console.log('[AdPlayer] ▶️ Play pulsado');
    this.setState('playing_ad');
    this.accumulatedMusicTime = 0;
    this.adPending = false;

    // 1. Reproducir anuncio de bienvenida
    await this.playAd(adsConfig.ads.start);
  }

  /**
   * PAUSAR
   */
  pause(): void {
    if (!this.audioElement) return;

    if (this.state === 'playing_music') {
      // Guardar tiempo acumulado antes de pausar
      this.accumulatedMusicTime += (Date.now() - this.lastMusicStartTime) / 1000;
      this.audioElement.pause();
      this.setState('paused');
      console.log(`[AdPlayer] ⏸️ Pausado. Tiempo acumulado: ${this.accumulatedMusicTime.toFixed(1)}s`);
    }
  }

  /**
   * REANUDAR
   */
  resume(): void {
    if (!this.audioElement || this.state !== 'paused') return;

    this.lastMusicStartTime = Date.now();
    this.audioElement.play().catch(err => {
      console.error('[AdPlayer] ❌ Error reanudando:', err);
    });
    this.setState('playing_music');
    console.log('[AdPlayer] ▶️ Reanudado');
  }

  /**
   * DETENER (Stop)
   * No reproduce anuncio de cierre
   */
  stop(): void {
    if (!this.audioElement) return;

    console.log('[AdPlayer] ⏹️ Stop pulsado - sin anuncio de cierre');
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.setState('stopped');
    this.accumulatedMusicTime = 0;
    this.adPending = false;
    this.currentAd = null;
  }

  /**
   * Reproducir un anuncio específico
   */
  private async playAd(ad: AdInfo): Promise<void> {
    if (!this.audioElement) return;

    this.currentAd = ad;
    this.setState('playing_ad');
    this.callbacks.onAdStart?.(ad);
    console.log(`[AdPlayer] 📢 Reproduciendo anuncio: ${ad.name}`);

    return new Promise((resolve) => {
      if (!this.audioElement) {
        resolve();
        return;
      }

      this.audioElement.src = ad.file;
      this.audioElement.play().then(() => {
        // El evento 'ended' manejará la transición
        const onEnded = () => {
          this.audioElement?.removeEventListener('ended', onEnded);
          this.currentAd = null;
          this.callbacks.onAdEnd?.(ad);
          console.log(`[AdPlayer] ✅ Anuncio terminado: ${ad.name}`);
          resolve();
        };
        this.audioElement?.addEventListener('ended', onEnded);
      }).catch(err => {
        console.error('[AdPlayer] ❌ Error reproduciendo anuncio:', err);
        resolve();
      });
    });
  }

  /**
   * Reproducir la siguiente pista de música
   */
  private async playNextMusic(): Promise<void> {
    if (!this.audioElement || !this.getMusicUrl) return;

    if (this.currentMusicIndex >= this.musicQueue.length) {
      // No hay más música - reproducir anuncio de cierre
      console.log('[AdPlayer] 🏁 Fin de la lista - reproduciendo anuncio de cierre');
      await this.playAd(adsConfig.ads.end);
      this.setState('stopped');
      return;
    }

    const trackId = this.musicQueue[this.currentMusicIndex];
    const url = this.getMusicUrl(trackId);

    console.log(`[AdPlayer] 🎵 Reproduciendo pista ${this.currentMusicIndex + 1}/${this.musicQueue.length}`);
    
    this.audioElement.src = url;
    this.lastMusicStartTime = Date.now();
    
    try {
      await this.audioElement.play();
      this.setState('playing_music');
      this.callbacks.onMusicStart?.();
      this.currentMusicIndex++;
    } catch (err) {
      console.error('[AdPlayer] ❌ Error reproduciendo música:', err);
      // Saltar a la siguiente
      this.currentMusicIndex++;
      this.playNextMusic();
    }
  }

  /**
   * Maneja el evento 'ended' del audio
   */
  private async handleAudioEnded(): Promise<void> {
    if (this.state === 'playing_ad') {
      // Terminó un anuncio - continuar con música
      await this.playNextMusic();
    } else if (this.state === 'playing_music') {
      // Terminó una canción
      this.callbacks.onMusicEnd?.();
      
      // Actualizar tiempo acumulado
      this.accumulatedMusicTime += (Date.now() - this.lastMusicStartTime) / 1000;
      this.callbacks.onAccumulatedTimeUpdate?.(this.accumulatedMusicTime);
      
      console.log(`[AdPlayer] ⏱️ Tiempo acumulado: ${this.accumulatedMusicTime.toFixed(1)}s`);

      // Verificar si debe insertar anuncio
      if (this.accumulatedMusicTime >= this.adInterval && !this.adPending) {
        this.adPending = true;
        console.log('[AdPlayer] 📢 10 segundos acumulados - insertando anuncio entre canciones');
        
        // Reproducir anuncio intermedio
        const ad = adsConfig.ads.middle[this.middleAdIndex % adsConfig.ads.middle.length];
        this.middleAdIndex++;
        
        await this.playAd(ad);
        
        // Resetear contador
        this.accumulatedMusicTime = 0;
        this.adPending = false;
      }

      // Continuar con la siguiente canción
      await this.playNextMusic();
    }
  }

  /**
   * Maneja errores de audio
   */
  private handleAudioError(event: Event): void {
    console.error('[AdPlayer] ❌ Error de audio:', event);
    
    // Si estaba reproduciendo música, saltar a la siguiente
    if (this.state === 'playing_music') {
      this.currentMusicIndex++;
      this.playNextMusic();
    }
  }

  /**
   * Actualiza el estado y notifica
   */
  private setState(newState: PlaybackState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Obtiene el estado actual
   */
  getState(): PlaybackState {
    return this.state;
  }

  /**
   * Obtiene el anuncio actual (si se está reproduciendo)
   */
  getCurrentAd(): AdInfo | null {
    return this.currentAd;
  }

  /**
   * Obtiene el tiempo acumulado de música
   */
  getAccumulatedTime(): number {
    if (this.state === 'playing_music') {
      return this.accumulatedMusicTime + (Date.now() - this.lastMusicStartTime) / 1000;
    }
    return this.accumulatedMusicTime;
  }

  /**
   * Limpia recursos
   */
  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    this.state = 'idle';
    this.accumulatedMusicTime = 0;
    this.currentAd = null;
    console.log('[AdPlayer] 🧹 Destructor');
  }
}

// Exportar instancia singleton
export const adPlayer = new AdPlayer();
