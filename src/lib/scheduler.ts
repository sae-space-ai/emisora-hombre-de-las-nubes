/**
 * ============================================================================
 * FASE 3: ALGORITMO DE PROGRAMACIÓN AUTÓNOMA (SCHEDULER)
 * ============================================================================
 * "Cerebro" de la emisora. Genera colas de reproducción inteligentes
 * basadas en el día de la semana, alternando pistas musicales con
 * marcadores de intervención TTS cada 3 pistas.
 */

import { AudiusTrack, Album, TrackCategory, classifyTrack, DAY_NAMES } from './audius';
import { Advertiser, adScheduler } from './adScheduler';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * QueueItem: Puede ser una pista musical, un marcador TTS o un anuncio publicitario
 */
export type QueueItem =
  | { type: 'track'; track: AudiusTrack }
  | { type: 'tts'; message: string; id: string }
  | { type: 'ad'; advertiser: Advertiser; id: string; position: 'start' | 'middle' | 'end' };

/**
 * Bloque de programación del día
 */
export interface ScheduleBlock {
  name: string;
  description: string;
  icon: string;
  albumIds: string[];
  fallbackCategories: TrackCategory[];
  startHour: number;
  endHour: number;
  ttsIntro: string;
  ttsOutro: string;
}

export interface DaySchedule {
  day: string;
  dayIndex: number;
  blocks: ScheduleBlock[];
}

// ============================================================================
// MENSAJES TTS
// ============================================================================

const TTS_STATION_IDS = [
  'Estás escuchando El Hombre de las Nubes, la radio digital del Profesor Manuel Gago Fernández.',
  'Radio El Hombre de las Nubes. Catálogo completo del Profesor Manuel Gago en Audius.',
  'Emisora autónoma veinticuatro siete. El Hombre de las Nubes.',
  'Continuamos en El Hombre de las Nubes. Música del Profesor Manuel Gago Fernández.',
  'El Hombre de las Nubes. La emisora digital del catálogo de Audius del Profesor Gago.',
];

const TTS_TRANSITIONS = [
  'Continuamos con más música del catálogo del Profesor Gago.',
  'No te vayas, en breve más clásicos del Profesor Manuel Gago.',
  'Seguimos con la programación de El Hombre de las Nubes.',
  'Más música del catálogo completo del Profesor Gago Fernández.',
  'El Hombre de las Nubes continúa. Disfruta de la música.',
  'Programación autónoma veinticuatro siete. Sigue con nosotros.',
];

const TTS_BLOCK_CHANGES = [
  'Cambio de programación. Nuevo bloque en El Hombre de las Nubes.',
  'Entramos en un nuevo bloque de programación. Continúa sintonizando.',
  'Nuevo bloque temático en la emisora del Profesor Gago.',
];

// ============================================================================
// PARRILLA SEMANAL (basada en álbumes específicos)
// ============================================================================

const WEEKLY_SCHEDULE: DaySchedule[] = [
  // DOMINGO (0): Flamenco puro + selección aleatoria
  {
    day: 'Domingo', dayIndex: 0,
    blocks: [
      { name: 'Amanecer Flamenco', description: 'Fandangos, alegrías y cantes al amanecer', icon: '☀️', albumIds: ['flamenco-puro'], fallbackCategories: ['flamenco', 'guitarra'], startHour: 6, endHour: 12, ttsIntro: 'Buenos días. Domingo flamenco con el Profesor Manuel Gago.', ttsOutro: 'Fin del amanecer flamenco.' },
      { name: 'Selección del Catálogo', description: 'Lo mejor de todo el catálogo', icon: '🎵', albumIds: [], fallbackCategories: ['general', 'copla', 'flamenco', 'sinfonica'], startHour: 12, endHour: 18, ttsIntro: 'Selección especial del catálogo completo.', ttsOutro: 'Fin de la selección del domingo.' },
      { name: 'Noche de Poesía', description: 'Poesía y audiolibros para la noche', icon: '🌙', albumIds: ['voz-del-tiempo'], fallbackCategories: ['hablado', 'sinfonica'], startHour: 18, endHour: 6, ttsIntro: 'Noche de poesía y palabra. El Hombre de las Nubes.', ttsOutro: 'Fin de la noche de poesía.' },
    ],
  },
  // LUNES (1): Marchas y música sacra
  {
    day: 'Lunes', dayIndex: 1,
    blocks: [
      { name: 'Marchas de Procesión', description: 'Marchas Vol. IX y Sacred Echoes', icon: '🎺', albumIds: ['marchas-vol-ix', 'sacred-echoes'], fallbackCategories: ['marchas'], startHour: 6, endHour: 13, ttsIntro: 'Lunes de marchas procesionales. El Hombre de las Nubes.', ttsOutro: 'Fin de las marchas del lunes.' },
      { name: 'Utrera Pasión y Gloria', description: 'Semana Santa de Utrera', icon: '✝️', albumIds: ['utrera-pasion'], fallbackCategories: ['marchas', 'sinfonica'], startHour: 13, endHour: 19, ttsIntro: 'Utrera, pasión y gloria. Música sacra del Profesor Gago.', ttsOutro: 'Fin del bloque de Utrera.' },
      { name: 'Noche Sinfónica', description: 'Obras sinfónicas para la noche', icon: '🎼', albumIds: ['bulerias-silencio'], fallbackCategories: ['sinfonica'], startHour: 19, endHour: 6, ttsIntro: 'Noche sinfónica en El Hombre de las Nubes.', ttsOutro: 'Fin de la noche sinfónica.' },
    ],
  },
  // MARTES (2): Copla
  {
    day: 'Martes', dayIndex: 2,
    blocks: [
      { name: 'Coplas de Sombra y Sangre', description: 'Copla dramática española', icon: '🌹', albumIds: ['coplas-sombra'], fallbackCategories: ['copla'], startHour: 6, endHour: 12, ttsIntro: 'Martes de copla. Sombra y sangre del Profesor Gago.', ttsOutro: 'Fin de Coplas de Sombra y Sangre.' },
      { name: 'Coplas Entre Cadenas y Rosas', description: 'Copla contemporánea', icon: '🌹', albumIds: ['coplas-cadenas'], fallbackCategories: ['copla'], startHour: 12, endHour: 18, ttsIntro: 'Coplas entre cadenas y rosas. Continúa la copla.', ttsOutro: 'Fin de las coplas de la tarde.' },
      { name: 'Saetas del Alma', description: 'Saetas para la noche', icon: '🙏', albumIds: ['saetas-alma'], fallbackCategories: ['copla', 'flamenco'], startHour: 18, endHour: 6, ttsIntro: 'Saetas del alma para la noche. El Hombre de las Nubes.', ttsOutro: 'Fin de las saetas nocturnas.' },
    ],
  },
  // MIÉRCOLES (3): Fusión y sinfónico conceptual
  {
    day: 'Miércoles', dayIndex: 3,
    blocks: [
      { name: 'Black Petals Fall', description: 'Flamenco barroco con electrónica', icon: '🖤', albumIds: ['black-petals'], fallbackCategories: ['electronica', 'flamenco'], startHour: 6, endHour: 12, ttsIntro: 'Miércoles de Black Petals Fall. Fusión única.', ttsOutro: 'Fin de Black Petals Fall.' },
      { name: 'LUDWIG XXI', description: 'Beethoven reinterpretado con electrónica', icon: '🎹', albumIds: ['ludwig-xxi'], fallbackCategories: ['sinfonica', 'electronica'], startHour: 12, endHour: 18, ttsIntro: 'LUDWIG XXI. Beethoven reinventado por el Profesor Gago.', ttsOutro: 'Fin de LUDWIG XXI.' },
      { name: 'Bulerías del Silencio', description: 'Sinfónico conceptual', icon: '🎻', albumIds: ['bulerias-silencio'], fallbackCategories: ['sinfonica', 'flamenco'], startHour: 18, endHour: 6, ttsIntro: 'Bulerías del Silencio. Sinfonía flamenca nocturna.', ttsOutro: 'Fin de Bulerías del Silencio.' },
    ],
  },
  // JUEVES (4): Trap espiritual y audiolibros
  {
    day: 'Jueves', dayIndex: 4,
    blocks: [
      { name: 'Spiritual Trap', description: 'Trap devocional y urbano', icon: '🙏', albumIds: ['spiritual-trap'], fallbackCategories: ['trap'], startHour: 6, endHour: 13, ttsIntro: 'Jueves de Spiritual Trap. Trap devocional del Profesor Gago.', ttsOutro: 'Fin del Spiritual Trap.' },
      { name: 'La Voz del Tiempo', description: 'Audiolibros y podcast', icon: '📖', albumIds: ['voz-del-tiempo'], fallbackCategories: ['hablado'], startHour: 13, endHour: 20, ttsIntro: 'La voz del tiempo. Audiolibros y poesía hablada.', ttsOutro: 'Fin de La Voz del Tiempo.' },
      { name: 'Noche Variada', description: 'Selección variada para la noche', icon: '✨', albumIds: [], fallbackCategories: ['general', 'electronica', 'trap'], startHour: 20, endHour: 6, ttsIntro: 'Noche variada en El Hombre de las Nubes.', ttsOutro: 'Fin de la noche variada.' },
    ],
  },
  // VIERNES (5): Guitarra y suites
  {
    day: 'Viernes', dayIndex: 5,
    blocks: [
      { name: 'Suite Andalucía', description: 'Piezas inspiradas en ciudades andaluzas', icon: '🏛️', albumIds: ['suite-andalucia'], fallbackCategories: ['sinfonica', 'guitarra'], startHour: 6, endHour: 12, ttsIntro: 'Viernes de Suite Andalucía. Ciudades en música.', ttsOutro: 'Fin de Suite Andalucía.' },
      { name: 'Guitarra Flamenca', description: 'Guitarra flamenca contemporánea', icon: '🎸', albumIds: ['guitarra'], fallbackCategories: ['guitarra', 'flamenco'], startHour: 12, endHour: 18, ttsIntro: 'Guitarra flamenca del Profesor Gago. Viernes de arte.', ttsOutro: 'Fin de la guitarra del viernes.' },
      { name: 'Romancero del Toque Vivido', description: 'Jaleos sinfónicos flamencos', icon: '🔥', albumIds: ['romancero-vol-ii'], fallbackCategories: ['flamenco', 'sinfonica'], startHour: 18, endHour: 6, ttsIntro: 'Romancero del Toque Vivido. Jaleos sinfónicos.', ttsOutro: 'Fin del Romancero.' },
    ],
  },
  // SÁBADO (6): Ópera y musical
  {
    day: 'Sábado', dayIndex: 6,
    blocks: [
      { name: "Opera L'Ombra della Musica", description: 'Ópera sobre Nannerl Mozart', icon: '🎭', albumIds: ['opera-ombra'], fallbackCategories: ['sinfonica'], startHour: 6, endHour: 13, ttsIntro: "Sábado de ópera. L'Ombra della Musica del Profesor Gago.", ttsOutro: "Fin de L'Ombra della Musica." },
      { name: 'PAN — EL MUSICAL', description: 'Obra sinfónico-teatral', icon: '🎪', albumIds: ['pan-musical'], fallbackCategories: ['sinfonica'], startHour: 13, endHour: 20, ttsIntro: 'PAN, el musical. Sinfonía teatral del Profesor Gago.', ttsOutro: 'Fin de PAN — EL MUSICAL.' },
      { name: 'Noche de Gala', description: 'Selección especial de todo el catálogo', icon: '🌟', albumIds: [], fallbackCategories: ['general', 'sinfonica', 'flamenco', 'copla'], startHour: 20, endHour: 6, ttsIntro: 'Noche de gala. Lo mejor del catálogo para el sábado.', ttsOutro: 'Fin de la noche de gala.' },
    ],
  },
];

// ============================================================================
// FUNCIONES DE PROGRAMACIÓN
// ============================================================================

/**
 * Obtiene la programación del día actual
 */
export function getTodaySchedule(): DaySchedule {
  const dayIndex = new Date().getDay();
  return WEEKLY_SCHEDULE[dayIndex];
}

/**
 * Obtiene el bloque de programación actual según la hora
 */
export function getCurrentBlock(): ScheduleBlock {
  const today = getTodaySchedule();
  const hour = new Date().getHours();

  for (const block of today.blocks) {
    if (block.startHour < block.endHour) {
      if (hour >= block.startHour && hour < block.endHour) return block;
    } else {
      if (hour >= block.startHour || hour < block.endHour) return block;
    }
  }
  return today.blocks[0];
}

/**
 * Obtiene el siguiente bloque
 */
export function getNextBlock(): ScheduleBlock {
  const today = getTodaySchedule();
  const currentBlock = getCurrentBlock();
  const idx = today.blocks.indexOf(currentBlock);
  if (idx < today.blocks.length - 1) return today.blocks[idx + 1];
  const tomorrow = (new Date().getDay() + 1) % 7;
  return WEEKLY_SCHEDULE[tomorrow].blocks[0];
}

// ============================================================================
// FASE 3.3: GENERACIÓN DE COLA CON TTS INTERCALADO
// ============================================================================

/**
 * Genera una cola de reproducción basada en el bloque actual.
 * Alterna pistas musicales con marcadores TTS cada 3 pistas.
 * Patrón: [Pista1, Pista2, Pista3, TTS, Pista4, Pista5, Pista6, TTS, ...]
 */
export function generateQueue(
  tracks: AudiusTrack[],
  albums: Album[],
  block: ScheduleBlock,
  excludeIds: Set<string> = new Set()
): QueueItem[] {
  // 1. Filtrar pistas del bloque (por álbum o por categoría)
  let matchingTracks: AudiusTrack[] = [];

  // Primero intentar por álbumes específicos del bloque
  if (block.albumIds.length > 0) {
    for (const albumId of block.albumIds) {
      const album = albums.find(a => a.id === albumId);
      if (album) {
        const albumTracks = tracks.filter(
          t => album.trackIds.includes(t.id) && !excludeIds.has(t.id)
        );
        matchingTracks = [...matchingTracks, ...albumTracks];
      }
    }
  }

  // Si no hay suficientes, usar categorías fallback
  if (matchingTracks.length < 5) {
    const categoryTracks = tracks.filter(t => {
      const cat = classifyTrack(t);
      return block.fallbackCategories.includes(cat) && !excludeIds.has(t.id);
    });
    matchingTracks = [...matchingTracks, ...categoryTracks];
  }

  // Eliminar duplicados
  const uniqueTracks = Array.from(new Map(matchingTracks.map(t => [t.id, t])).values());

  // Si aún no hay suficientes, reset de exclusiones
  if (uniqueTracks.length < 5) {
    const allMatching = tracks.filter(t => {
      if (block.albumIds.length > 0) {
        return block.albumIds.some(aid => {
          const album = albums.find(a => a.id === aid);
          return album?.trackIds.includes(t.id);
        });
      }
      const cat = classifyTrack(t);
      return block.fallbackCategories.includes(cat);
    });
    if (allMatching.length > 0) {
      matchingTracks = shuffleArray(allMatching);
    } else {
      matchingTracks = shuffleArray([...tracks]);
    }
  } else {
    matchingTracks = shuffleArray(uniqueTracks);
  }

  // 2. Construir QueueItem[] con anuncios publicitarios intercalados
  return buildQueueWithAds(matchingTracks);
}

/**
 * Construye la cola con anuncios al INICIO y FINAL de cada track
 * Los anuncios cada 10 segundos se manejan en tiempo real en el reproductor
 * Patrón: [AD_START, Track1, AD_END, AD_START, Track2, AD_END, ...]
 */
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  let adCounter = 0;

  for (const track of tracks) {
    // Anuncio al INICIO de cada pista
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      id: `ad-start-${Date.now()}-${adCounter++}`,
      position: 'start',
    });

    // Pista musical
    queue.push({ type: 'track', track });

    // Anuncio al FINAL de cada pista
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      id: `ad-end-${Date.now()}-${adCounter++}`,
      position: 'end',
    });
  }

  return queue;
}

/**
 * Obtiene el siguiente anuncio de la rotación
 */
function getNextAdvertiser(): Advertiser {
  const ad = adScheduler.getNextAd();
  if (!ad) {
    // Si no hay anunciantes, devolver un anuncio placeholder
    return {
      id: 'placeholder',
      name: 'El Hombre de las Nubes',
      category: 'Emisora',
      address: 'Almendralejo',
      phone: '',
      website: '',
      description: 'Radio autónoma 24/7',
      adScript: 'Estás escuchando El Hombre de las Nubes, la radio digital del Profesor Manuel Gago Fernández.',
      audioFile: null,
      ttsVoice: 'es-ES',
      duration: 10,
      enabled: true
    };
  }
  return ad;
}

/**
 * FASE 3.4: Obtiene un mensaje TTS aleatorio
 */
function getRandomTTSMessage(): string {
  const allMessages = [...TTS_STATION_IDS, ...TTS_TRANSITIONS];
  return allMessages[Math.floor(Math.random() * allMessages.length)];
}

/**
 * Mensaje TTS para cambio de bloque
 */
export function getBlockChangeMessage(blockName: string): string {
  const base = TTS_BLOCK_CHANGES[Math.floor(Math.random() * TTS_BLOCK_CHANGES.length)];
  return `${base} ${blockName}.`;
}

/**
 * Mensaje TTS de bienvenida
 */
export function getWelcomeMessage(): string {
  const hour = new Date().getHours();
  let greeting = '';
  if (hour >= 6 && hour < 12) greeting = 'Buenos días.';
  else if (hour >= 12 && hour < 20) greeting = 'Buenas tardes.';
  else greeting = 'Buenas noches.';

  return `${greeting} Bienvenido a Radio El Hombre de las Nubes. Emisora autónoma veinticuatro siete con el catálogo completo del Profesor Manuel Gago Fernández. Comenzamos.`;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Guía de programación del día actual
 */
export function getTodayProgramGuide(): Array<ScheduleBlock & { isCurrent: boolean; isPast: boolean }> {
  const today = getTodaySchedule();
  const currentBlock = getCurrentBlock();
  const currentHour = new Date().getHours();

  return today.blocks.map(block => {
    const isCurrent = block.name === currentBlock.name;
    const isPast = block.startHour < block.endHour
      ? currentHour >= block.endHour
      : false;
    return { ...block, isCurrent, isPast };
  });
}

export function getCurrentDayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
