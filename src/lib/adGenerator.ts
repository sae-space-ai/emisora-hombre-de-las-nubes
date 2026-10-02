/**
 * FASE 2: Generador de Anuncios con TTS
 * Genera anuncios usando Web Speech API (speechSynthesis)
 */

import { Advertiser } from './adScheduler';

class AdGenerator {
  private synth: SpeechSynthesis | null = null;
  private isInitialized = false;

  /**
   * Inicializa el sintetizador de voz
   */
  initialize(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[AdGenerator] Speech Synthesis no disponible');
      return;
    }

    this.synth = window.speechSynthesis;
    this.isInitialized = true;
    console.log('[AdGenerator] Inicializado');
  }

  /**
   * Genera y reproduce un anuncio usando TTS
   * @param advertiser - Datos del anunciante
   * @param onEnd - Callback cuando termina el anuncio
   * @param onStart - Callback cuando empieza el anuncio
   */
  async speakAd(
    advertiser: Advertiser,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.isInitialized || !this.synth) {
      console.error('[AdGenerator] No inicializado');
      onEnd?.();
      return;
    }

    return new Promise((resolve) => {
      // Cancelar cualquier utterance previo
      this.synth!.cancel();

      // Crear utterance con el script del anuncio
      const utterance = new SpeechSynthesisUtterance(advertiser.adScript);

      // Configurar voz
      utterance.lang = 'es-ES';
      utterance.rate = 1.0; // Velocidad normal
      utterance.pitch = 1.0; // Tono normal
      utterance.volume = 1.0; // Volumen máximo

      // Intentar usar la voz específica si está disponible
      const voices = this.synth!.getVoices();
      const targetVoice = voices.find(v => v.lang === 'es-ES');
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // Callbacks
      utterance.onstart = () => {
        console.log(`[AdGenerator] Reproduciendo anuncio: ${advertiser.name}`);
        onStart?.();
      };

      utterance.onend = () => {
        console.log(`[AdGenerator] Anuncio terminado: ${advertiser.name}`);
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[AdGenerator] Error en TTS:', event.error);
        onEnd?.();
        resolve();
      };

      // Reproducir
      this.synth!.speak(utterance);
    });
  }

  /**
   * Cancela cualquier anuncio en reproducción
   */
  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      console.log('[AdGenerator] Anuncio cancelado');
    }
  }

  /**
   * Verifica si el generador está listo
   */
  isReady(): boolean {
    return this.isInitialized && this.synth !== null;
  }

  /**
   * Obtiene las voces disponibles
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Obtiene las voces en español
   */
  getSpanishVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(v => v.lang.startsWith('es'));
  }
}

// Exportar instancia singleton
export const adGenerator = new AdGenerator();
