/**
 * FASE 1: Audio Mixer con Web Audio API
 * Gestiona la mezcla de música y publicidad con audio ducking profesional
 */

import adConfig from '../data/adConfig.json';

class AudioMixer {
  private audioContext: AudioContext | null = null;
  private musicSource: MediaElementAudioSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private currentMusicVolume = 1.0;
  private duckingLevel = adConfig.duckingLevel;
  private fadeDuration = adConfig.duckingFadeSeconds;

  /**
   * Inicializa el AudioContext y los nodos de ganancia
   */
  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Crear AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear nodos de ganancia
      this.musicGain = this.audioContext.createGain();
      this.masterGain = this.audioContext.createGain();

      // Configurar volúmenes iniciales
      this.musicGain.gain.value = 1.0;
      this.masterGain.gain.value = 1.0;

      // Conectar fuente de música → musicGain → masterGain → destination
      this.musicSource = this.audioContext.createMediaElementSource(audioElement);
      this.musicSource.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('[AudioMixer] Inicializado correctamente');
    } catch (error) {
      console.error('[AudioMixer] Error al inicializar:', error);
      throw error;
    }
  }

  /**
   * Aplica audio ducking: baja el volumen de la música durante un anuncio
   */
  async duckMusic(durationSeconds: number): Promise<void> {
    if (!this.audioContext || !this.musicGain) {
      console.warn('[AudioMixer] No inicializado, aplicando ducking directo');
      return;
    }

    const now = this.audioContext.currentTime;
    const targetVolume = this.duckingLevel;

    // Guardar volumen actual
    this.currentMusicVolume = this.musicGain.gain.value;

    // Fade out suave
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.currentMusicVolume, now);
    this.musicGain.gain.linearRampToValueAtTime(targetVolume, now + this.fadeDuration);

    console.log(`[AudioMixer] Ducking aplicado: ${this.currentMusicVolume} → ${targetVolume}`);
  }

  /**
   * Restaura el volumen de la música después del anuncio
   */
  async restoreMusic(): Promise<void> {
    if (!this.audioContext || !this.musicGain) {
      console.warn('[AudioMixer] No inicializado, restaurando directo');
      return;
    }

    const now = this.audioContext.currentTime;
    const targetVolume = this.currentMusicVolume;

    // Fade in suave
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.duckingLevel, now);
    this.musicGain.gain.linearRampToValueAtTime(targetVolume, now + this.fadeDuration);

    console.log(`[AudioMixer] Volumen restaurado: ${this.duckingLevel} → ${targetVolume}`);
  }

  /**
   * Establece el volumen maestro
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGain) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = clampedVolume;
    console.log(`[AudioMixer] Volumen maestro: ${clampedVolume}`);
  }

  /**
   * Obtiene el AudioContext (para otros módulos)
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Verifica si el mixer está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Limpia y cierra el AudioContext
   */
  async cleanup(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.musicSource = null;
      this.musicGain = null;
      this.masterGain = null;
      this.isInitialized = false;
      console.log('[AudioMixer] Limpiado');
    }
  }
}

// Exportar instancia singleton
export const audioMixer = new AudioMixer();
