/**
 * Servicio TTS Mejorado para Anuncios Publicitarios
 * Maneja correctamente la carga de voces y el desbloqueo del navegador
 */

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let voicesLoaded = false;
let spanishVoice: SpeechSynthesisVoice | null = null;
let ttsUnlocked = false;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el sistema TTS y precarga las voces
 */
export function initTTSSystem(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[TTS] Speech Synthesis no disponible en este navegador');
    return;
  }

  console.log('[TTS] 🔄 Inicializando sistema TTS...');

  // Cargar voces
  loadVoices();

  // Escuchar el evento voiceschanged (se dispara cuando las voces están listas)
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('[TTS] ✅ Voces cargadas');
    loadVoices();
  };
}

/**
 * Carga las voces disponibles y busca una voz en español
 */
function loadVoices(): void {
  if (!window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    console.log('[TTS] ⏳ Voces aún no disponibles...');
    return;
  }

  console.log(`[TTS] 📋 ${voices.length} voces disponibles`);

  // Buscar voz en español (priorizar España)
  spanishVoice = 
    voices.find(v => v.lang === 'es-ES' && v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang === 'es-ES') ||
    voices.find(v => v.lang.startsWith('es-')) ||
    voices.find(v => v.lang === 'es') ||
    null;

  if (spanishVoice) {
    console.log(`[TTS] ✅ Voz española seleccionada: ${spanishVoice.name} (${spanishVoice.lang})`);
  } else {
    console.warn('[TTS] ⚠️ No se encontró voz en español, usando voz por defecto');
  }

  voicesLoaded = true;
}

/**
 * Desbloquea el TTS con una interacción del usuario
 * Debe llamarse en respuesta a un clic del usuario
 */
export async function unlockTTS(): Promise<boolean> {
  if (ttsUnlocked) {
    console.log('[TTS] ✅ TTS ya desbloqueado');
    return true;
  }

  if (!window.speechSynthesis) {
    console.error('[TTS] ❌ Speech Synthesis no disponible');
    return false;
  }

  console.log('[TTS] 🔓 Desbloqueando TTS...');

  return new Promise((resolve) => {
    // Cancelar cualquier TTS previo
    window.speechSynthesis.cancel();

    // Crear utterance silencioso para desbloquear
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    utterance.lang = 'es-ES';

    utterance.onend = () => {
      console.log('[TTS] ✅ TTS desbloqueado correctamente');
      ttsUnlocked = true;
      resolve(true);
    };

    utterance.onerror = (event) => {
      console.error('[TTS] ❌ Error desbloqueando TTS:', event.error);
      // Aún así marcar como desbloqueado para intentar continuar
      ttsUnlocked = true;
      resolve(false);
    };

    // Hablar (aunque sea silencio)
    window.speechSynthesis.speak(utterance);

    // Timeout de seguridad
    setTimeout(() => {
      if (!ttsUnlocked) {
        console.warn('[TTS] ⚠️ Timeout desbloqueando TTS, continuando de todos modos');
        ttsUnlocked = true;
        resolve(false);
      }
    }, 1000);
  });
}

// ============================================================================
// REPRODUCCIÓN DE ANUNCIOS
// ============================================================================

/**
 * Reproduce un anuncio publicitario con TTS
 * @param script - Texto a reproducir
 * @param onEnd - Callback cuando termina
 * @param onError - Callback si hay error
 */
export function speakAd(
  script: string,
  onEnd?: () => void,
  onError?: (error: string) => void
): void {
  if (!window.speechSynthesis) {
    console.error('[TTS] ❌ Speech Synthesis no disponible');
    onError?.('Speech Synthesis no disponible');
    return;
  }

  // Esperar a que las voces estén cargadas
  if (!voicesLoaded) {
    console.log('[TTS] ⏳ Esperando a que las voces estén cargadas...');
    setTimeout(() => speakAd(script, onEnd, onError), 100);
    return;
  }

  console.log(`[TTS] 🎙️ Reproduciendo anuncio: "${script.substring(0, 50)}..."`);

  // Cancelar cualquier TTS previo
  window.speechSynthesis.cancel();

  // Crear utterance
  const utterance = new SpeechSynthesisUtterance(script);
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Usar voz española si está disponible
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  // Callbacks
  utterance.onstart = () => {
    console.log('[TTS] ▶️ TTS iniciado');
  };

  utterance.onend = () => {
    console.log('[TTS] ✅ TTS terminado');
    onEnd?.();
  };

  utterance.onerror = (event) => {
    console.error('[TTS] ❌ Error en TTS:', event.error);
    onError?.(event.error);
  };

  // Pequeño delay antes de hablar (ayuda en algunos navegadores)
  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
      console.log('[TTS] 🗣️ speak() llamado');
    } catch (error) {
      console.error('[TTS] ❌ Error llamando a speak():', error);
      onError?.('Error llamando a speak()');
    }
  }, 50);
}

/**
 * Verifica si el TTS está disponible y desbloqueado
 */
export function isTTSReady(): boolean {
  return typeof window !== 'undefined' && 
         !!window.speechSynthesis && 
         voicesLoaded;
}

/**
 * Obtiene información de debug del TTS
 */
export function getTTSDebugInfo(): {
  available: boolean;
  voicesLoaded: boolean;
  ttsUnlocked: boolean;
  spanishVoice: string | null;
  totalVoices: number;
} {
  const voices = window.speechSynthesis?.getVoices() || [];
  
  return {
    available: typeof window !== 'undefined' && !!window.speechSynthesis,
    voicesLoaded,
    ttsUnlocked,
    spanishVoice: spanishVoice?.name || null,
    totalVoices: voices.length,
  };
}

/**
 * Detiene cualquier TTS en curso
 */
export function stopTTS(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    console.log('[TTS] ⏹️ TTS detenido');
  }
}
