/**
 * Motor de Programación de la Radio
 * Gestiona la parrilla de programación automática basada en día y hora
 * Genera colas de reproducción temáticas sin intervención humana
 */

import { AudiusTrack, TrackCategory, classifyTrack } from './audius';

// Definición de bloques de programación por día de la semana
export interface ScheduleBlock {
  name: string;
  description: string;
  icon: string;
  categories: TrackCategory[];
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

// Parrilla semanal completa
const WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    day: 'Domingo',
    dayIndex: 0,
    blocks: [
      { name: 'Amanecer Sacro', description: 'Marchas procesionales para el domingo', icon: '☀️', categories: ['marchas', 'sinfonica'], startHour: 6, endHour: 12, ttsIntro: 'Buenos días. Comenzamos el domingo con la música sacra del Prof. Manuel Gago Fernández.', ttsOutro: 'Hasta aquí el amanecer sacro.' },
      { name: 'Tarde de Copla', description: 'Copla española para la sobremesa', icon: '🌹', categories: ['copla'], startHour: 12, endHour: 17, ttsIntro: 'Continuamos con lo mejor de la copla española.', ttsOutro: 'Fin de la tarde de copla.' },
      { name: 'Flamenco al Atardecer', description: 'Flamenco y guitarra para la tarde', icon: '🔥', categories: ['flamenco', 'guitarra'], startHour: 17, endHour: 21, ttsIntro: 'Llega el flamenco a El Hombre de las Nubes.', ttsOutro: 'Despedimos el flamenco de hoy.' },
      { name: 'Noche de Poesía', description: 'Poesía y audiolibros para la noche', icon: '🌙', categories: ['hablado', 'sinfonica'], startHour: 21, endHour: 6, ttsIntro: 'Buenas noches. Poesía y palabra para acompañar el descanso.', ttsOutro: 'Fin de la noche de poesía.' },
    ],
  },
  {
    day: 'Lunes',
    dayIndex: 1,
    blocks: [
      { name: 'Marchas de la Semana', description: 'Arrancamos con marchas procesionales', icon: '🎺', categories: ['marchas'], startHour: 6, endHour: 11, ttsIntro: 'Buenos días. Lunes de marchas procesionales con el Prof. Manuel Gago.', ttsOutro: 'Fin del bloque de marchas.' },
      { name: 'Copla y Drama', description: 'Copla dramática para la mañana', icon: '🎭', categories: ['copla'], startHour: 11, endHour: 15, ttsIntro: 'La copla más dramática suena ahora.', ttsOutro: 'Despedimos la copla del mediodía.' },
      { name: 'Tarde Sinfónica', description: 'Música sinfónica y clásica', icon: '🎼', categories: ['sinfonica'], startHour: 15, endHour: 19, ttsIntro: 'Tarde de música sinfónica en El Hombre de las Nubes.', ttsOutro: 'Fin de la tarde sinfónica.' },
      { name: 'Noche Electrónica', description: 'Electrónica y ambient nocturno', icon: '⚡', categories: ['electronica', 'trap'], startHour: 19, endHour: 6, ttsIntro: 'La noche se viste de electrónica.', ttsOutro: 'Fin de la sesión electrónica.' },
    ],
  },
  {
    day: 'Martes',
    dayIndex: 2,
    blocks: [
      { name: 'Flamenco Matinal', description: 'Flamenco puro para empezar', icon: '💃', categories: ['flamenco', 'guitarra'], startHour: 6, endHour: 12, ttsIntro: 'Martes de flamenco puro. El arte del Prof. Gago.', ttsOutro: 'Fin del flamenco matinal.' },
      { name: 'Copla al Mediodía', description: 'Copla para la hora del almuerzo', icon: '🌹', categories: ['copla'], startHour: 12, endHour: 16, ttsIntro: 'Copla española para acompañar el mediodía.', ttsOutro: 'Despedimos la copla.' },
      { name: 'Trap Espiritual', description: 'Trap devocional y urbano', icon: '🙏', categories: ['trap', 'electronica'], startHour: 16, endHour: 21, ttsIntro: 'Trap espiritual y sonidos urbanos llegan a la emisora.', ttsOutro: 'Fin del bloque de trap espiritual.' },
      { name: 'Madrugada en Silencio', description: 'Selección variada para la noche', icon: '✨', categories: ['general', 'sinfonica', 'hablado'], startHour: 21, endHour: 6, ttsIntro: 'Selección especial para la madrugada.', ttsOutro: 'Fin de la programación nocturna.' },
    ],
  },
  {
    day: 'Miércoles',
    dayIndex: 3,
    blocks: [
      { name: 'Sinfónica del Profeta', description: 'Obras sinfónicas y conceptuales', icon: '🎻', categories: ['sinfonica'], startHour: 6, endHour: 12, ttsIntro: 'Miércoles sinfónico. Las grandes obras del catálogo.', ttsOutro: 'Fin del bloque sinfónico.' },
      { name: 'Flamenco Sinfónico', description: 'Fusión de flamenco y orquesta', icon: '🔥', categories: ['flamenco', 'sinfonica'], startHour: 12, endHour: 17, ttsIntro: 'Flamenco sinfónico: la fusión perfecta.', ttsOutro: 'Fin del flamenco sinfónico.' },
      { name: 'Guitarra Flamenca', description: 'Guitarra flamenca contemporánea', icon: '🎸', categories: ['guitarra'], startHour: 17, endHour: 21, ttsIntro: 'La guitarra flamenca del Prof. Gago toma la emisora.', ttsOutro: 'Fin de la sesión de guitarra.' },
      { name: 'Noche de Copla', description: 'Copla para cerrar el día', icon: '🌹', categories: ['copla', 'general'], startHour: 21, endHour: 6, ttsIntro: 'Noche de copla para acompañar las horas bajas.', ttsOutro: 'Fin de la noche de copla.' },
    ],
  },
  {
    day: 'Jueves',
    dayIndex: 4,
    blocks: [
      { name: 'Marchas y Pasión', description: 'Marchas procesionales intensas', icon: '✝️', categories: ['marchas'], startHour: 6, endHour: 11, ttsIntro: 'Jueves de pasión. Marchas procesionales del Prof. Gago.', ttsOutro: 'Fin de las marchas del jueves.' },
      { name: 'Electrónica Barroca', description: 'Flamenco barroco con electrónica', icon: '⚡', categories: ['electronica', 'flamenco'], startHour: 11, endHour: 16, ttsIntro: 'Electrónica barroca: la vanguardia del sonido.', ttsOutro: 'Fin de la electrónica barroca.' },
      { name: 'Trap y Urbano', description: 'Trap espiritual y devocional', icon: '🙏', categories: ['trap'], startHour: 16, endHour: 20, ttsIntro: 'Trap espiritual para la tarde.', ttsOutro: 'Fin del bloque de trap.' },
      { name: 'Poesía Nocturna', description: 'Audiolibros y poesía hablada', icon: '📖', categories: ['hablado'], startHour: 20, endHour: 6, ttsIntro: 'La voz del tiempo. Poesía y palabra para la noche.', ttsOutro: 'Fin de la poesía nocturna.' },
    ],
  },
  {
    day: 'Viernes',
    dayIndex: 5,
    blocks: [
      { name: 'Flamenco Viernes', description: 'Flamenco intenso para el viernes', icon: '🔥', categories: ['flamenco', 'guitarra'], startHour: 6, endHour: 13, ttsIntro: '¡Viernes de flamenco! El arte jondo del Prof. Gago.', ttsOutro: 'Fin del flamenco del viernes.' },
      { name: 'Copla de Viernes', description: 'Copla para el mediodía', icon: '🌹', categories: ['copla'], startHour: 13, endHour: 17, ttsIntro: 'Copla española para el mediodía del viernes.', ttsOutro: 'Fin de la copla de mediodía.' },
      { name: 'Sinfónica de Tarde', description: 'Música sinfónica para la tarde', icon: '🎼', categories: ['sinfonica'], startHour: 17, endHour: 21, ttsIntro: 'Tarde sinfónica para cerrar la semana laboral.', ttsOutro: 'Fin de la sinfónica de tarde.' },
      { name: 'Noche de Fiesta', description: 'Selección variada y electrónica', icon: '🎉', categories: ['electronica', 'trap', 'flamenco'], startHour: 21, endHour: 6, ttsIntro: '¡Noche de fiesta! Lo mejor del catálogo para el fin de semana.', ttsOutro: 'Fin de la noche de fiesta.' },
    ],
  },
  {
    day: 'Sábado',
    dayIndex: 6,
    blocks: [
      { name: 'Mañana de Guitarra', description: 'Guitarra flamenca para el sábado', icon: '🎸', categories: ['guitarra', 'flamenco'], startHour: 6, endHour: 12, ttsIntro: 'Sábado de guitarra flamenca. Relájate con el Prof. Gago.', ttsOutro: 'Fin de la mañana de guitarra.' },
      { name: 'Mediodía Variado', description: 'Lo mejor del catálogo', icon: '🎵', categories: ['general', 'copla', 'flamenco'], startHour: 12, endHour: 17, ttsIntro: 'Lo mejor del catálogo del Prof. Manuel Gago Fernández.', ttsOutro: 'Fin del mediodía variado.' },
      { name: 'Tarde de Marchas', description: 'Marchas para la tarde del sábado', icon: '🎺', categories: ['marchas', 'sinfonica'], startHour: 17, endHour: 21, ttsIntro: 'Marchas procesionales para la tarde del sábado.', ttsOutro: 'Fin de las marchas de la tarde.' },
      { name: 'Noche de Poesía', description: 'Poesía y audiolibros', icon: '🌙', categories: ['hablado', 'sinfonica'], startHour: 21, endHour: 6, ttsIntro: 'Noche de poesía para cerrar la semana.', ttsOutro: 'Fin de la noche de poesía.' },
    ],
  },
];

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
      if (hour >= block.startHour && hour < block.endHour) {
        return block;
      }
    } else {
      // Bloque que cruza medianoche
      if (hour >= block.startHour || hour < block.endHour) {
        return block;
      }
    }
  }

  // Fallback: primer bloque del día
  return today.blocks[0];
}

/**
 * Obtiene el siguiente bloque de programación
 */
export function getNextBlock(): ScheduleBlock {
  const today = getTodaySchedule();
  const currentBlock = getCurrentBlock();
  const currentIndex = today.blocks.indexOf(currentBlock);
  
  if (currentIndex < today.blocks.length - 1) {
    return today.blocks[currentIndex + 1];
  }
  
  // Si es el último bloque del día, el siguiente es el primero del día siguiente
  const tomorrowIndex = (new Date().getDay() + 1) % 7;
  return WEEKLY_SCHEDULE[tomorrowIndex].blocks[0];
}

/**
 * Genera una cola de reproducción basada en el bloque actual
 * Filtra pistas por categoría y las mezcla aleatoriamente
 */
export function generateQueue(
  tracks: AudiusTrack[],
  block: ScheduleBlock,
  excludeIds: Set<string> = new Set()
): AudiusTrack[] {
  // Filtrar pistas por las categorías del bloque
  const matchingTracks = tracks.filter(track => {
    const category = classifyTrack(track);
    return block.categories.includes(category) && !excludeIds.has(track.id);
  });

  // Si hay suficientes pistas no repetidas, usarlas
  if (matchingTracks.length >= 5) {
    return shuffleArray(matchingTracks);
  }

  // Si no hay suficientes, incluir todas las pistas del catálogo (reset de repetición)
  const allMatching = tracks.filter(track => {
    const category = classifyTrack(track);
    return block.categories.includes(category);
  });

  if (allMatching.length > 0) {
    return shuffleArray(allMatching);
  }

  // Fallback: todas las pistas mezcladas
  return shuffleArray([...tracks]);
}

/**
 * Obtiene la parrilla completa de hoy con información de bloques
 */
export function getTodayProgramGuide(): Array<ScheduleBlock & { isCurrent: boolean; isPast: boolean }> {
  const today = getTodaySchedule();
  const currentBlock = getCurrentBlock();
  const currentHour = new Date().getHours();

  return today.blocks.map(block => {
    const isCurrent = block.name === currentBlock.name;
    let isPast = false;
    
    if (block.startHour < block.endHour) {
      isPast = currentHour >= block.endHour;
    } else {
      isPast = false; // Bloques que cruzan medianoche no son "pasados" fácilmente
    }

    return { ...block, isCurrent, isPast };
  });
}

/**
 * Mezcla un array de forma aleatoria (Fisher-Yates)
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
 * Obtiene el nombre del día actual
 */
export function getCurrentDayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

/**
 * Obtiene la hora formateada
 */
export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
