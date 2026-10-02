/**
 * Servicio de Text-to-Speech para locuciones de la emisora
 * Utiliza la Web Speech API (SpeechSynthesis) del navegador
 * Genera identificaciones de voz automáticas entre pistas
 */

// Voces disponibles en español
let spanishVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

/**
 * Inicializa el servicio TTS y busca una voz en español
 */
export function initTTS(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[TTS] Speech Synthesis no disponible en este navegador');
    return;
  }

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Buscar voz en español (priorizar España)
    spanishVoice = 
      voices.find(v => v.lang === 'es-ES' && v.name.includes('female')) ||
      voices.find(v => v.lang === 'es-ES') ||
      voices.find(v => v.lang.startsWith('es-')) ||
      voices.find(v => v.lang === 'es') ||
      null;
    
    voicesLoaded = true;
    console.log('[TTS] Voces cargadas. Voz seleccionada:', spanishVoice?.name || 'Por defecto');
  };

  // Las voces pueden cargarse de forma asíncrona
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Reproduce una locución de texto
 * @param text - Texto a pronunciar
 * @param options - Opciones de voz
 * @returns Promise que se resuelve cuando termina la locución
 */
export function speak(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onStart?: () => void;
  } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[TTS] Speech Synthesis no disponible');
      resolve();
      return;
    }

    // Cancelar cualquier locución previa
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar voz
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    utterance.lang = 'es-ES';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
      resolve();
    };

    utterance.onerror = () => {
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Locución de identificación de la emisora
 */
export async function speakStationID(): Promise<void> {
  const ids = [
    'Estás escuchando Radio El Hombre de las Nubes. Música del Prof. Manuel Gago Fernández.',
    'El Hombre de las Nubes. El catálogo completo del Prof. Manuel Gago.',
    'Radio El Hombre de las Nubes. Flamenco, copla, sinfónica y más.',
    'Continuamos en El Hombre de las Nubes. Prof. Manuel Gago Fernández.',
    'Emisora autónoma veinticuatro siete. El Hombre de las Nubes.',
  ];
  
  const randomId = ids[Math.floor(Math.random() * ids.length)];
  await speak(randomId, { rate: 0.85 });
}

/**
 * Locución de transición entre bloques de programación
 */
export async function speakBlockTransition(blockName: string, description: string): Promise<void> {
  const text = `Nuevo bloque de programación: ${blockName}. ${description}`;
  await speak(text, { rate: 0.85 });
}

/**
 * Locución entre pistas (transición corta)
 */
export async function speakTrackTransition(trackTitle: string): Promise<void> {
  const transitions = [
    `Continuamos con ${trackTitle}.`,
    `Ahora suena ${trackTitle}.`,
    `Del Prof. Manuel Gago: ${trackTitle}.`,
    `${trackTitle}. El Hombre de las Nubes.`,
  ];
  
  const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
  await speak(randomTransition, { rate: 0.9 });
}

/**
 * Locución de bienvenida al iniciar la emisora
 */
export async function speakWelcome(): Promise<void> {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour >= 6 && hour < 12) {
    greeting = 'Buenos días.';
  } else if (hour >= 12 && hour < 20) {
    greeting = 'Buenas tardes.';
  } else {
    greeting = 'Buenas noches.';
  }
  
  const text = `${greeting} Bienvenido a Radio El Hombre de las Nubes. La emisora autónoma con el catálogo completo del Prof. Manuel Gago Fernández. Comenzamos la programación.`;
  await speak(text, { rate: 0.85 });
}

/**
 * Verifica si el TTS está disponible
 */
export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/**
 * Detiene cualquier locución en curso
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
