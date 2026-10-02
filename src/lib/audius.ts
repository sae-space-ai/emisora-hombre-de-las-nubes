/**
 * ============================================================================
 * FASE 2: ALGORITMO DE INGESTA Y CATALOGACIÓN (CONTENT PLATFORM)
 * ============================================================================
 * Módulo responsable de interactuar con la API de Audius.
 * - Obtiene el perfil del artista @profmanuelgago
 * - Extrae TODAS las pistas con paginación automática
 * - Clasifica cada pista en su álbum correspondiente
 * - Genera un catálogo enriquecido con metadatos completos
 */

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

const API_BASE = 'https://api.audius.co/v1';
const APP_NAME = 'Radio El Hombre de las Nubes';
const ARTIST_HANDLE = 'profmanuelgago';
const PAGE_SIZE = 100;

// API Key de Audius (desde variables de entorno)
const AUDIUS_API_KEY = import.meta.env.VITE_AUDIUS_API_KEY || 'c687bc369a514c30adcc07ddbc10aeb38fd29f03';

// ============================================================================
// TIPOS
// ============================================================================

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  bio: string;
  follower_count: number;
  track_count: number;
  album_count: number;
  playlist_count: number;
  profile_picture?: string | null;
  profile_picture_sizes?: string | null;
  cover_photo?: string | null;
  cover_photo_sizes?: string | null;
  is_verified: boolean;
  location?: string;
  website?: string;
}

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  genre: string;
  mood?: string;
  tags?: string;
  artwork?: string | null;
  cover_art?: string | null;
  cover_art_sizes?: string | null;
  permalink: string;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  description?: string;
  release_date?: string;
  created_at?: string;
  bpm?: number;
  musical_key?: string;
  user?: {
    id: string;
    name: string;
    handle: string;
  };
  // Campo enriquecido: álbum asignado
  albumId?: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  artwork?: string | null;
  trackIds: string[];
  dayOfWeek?: number; // Día de la semana asignado (0=Dom, 1=Lun, etc.)
}

export type TrackCategory =
  | 'marchas'
  | 'copla'
  | 'flamenco'
  | 'trap'
  | 'sinfonica'
  | 'electronica'
  | 'hablado'
  | 'guitarra'
  | 'general';

export interface Catalog {
  artist: AudiusUser | null;
  tracks: AudiusTrack[];
  albums: Album[];
  lastUpdated: string;
  totalTracks: number;
}

// ============================================================================
// ESTRUCTURA DE ÁLBUMES CON ASIGNACIÓN SEMANAL
// ============================================================================

export const ALBUM_DEFINITIONS: Album[] = [
  // LUNES (1): Marchas y música sacra
  { id: 'marchas-vol-ix', name: 'Marchas de Procesión Volumen IX', dayOfWeek: 1, trackIds: [] },
  { id: 'sacred-echoes', name: 'Sacred Echoes: Processional Marches of Andalusia', dayOfWeek: 1, trackIds: [] },
  { id: 'utrera-pasion', name: 'UTRERA PASIÓN Y GLORIA', dayOfWeek: 1, trackIds: [] },

  // MARTES (2): Copla
  { id: 'coplas-sombra', name: 'Coplas de Sombra y Sangre', dayOfWeek: 2, trackIds: [] },
  { id: 'coplas-cadenas', name: 'Coplas Entre cadenas y rosas', dayOfWeek: 2, trackIds: [] },
  { id: 'saetas-alma', name: 'Saetas del Alma', dayOfWeek: 2, trackIds: [] },

  // MIÉRCOLES (3): Fusión y sinfónico conceptual
  { id: 'black-petals', name: 'Black Petals Fall', dayOfWeek: 3, trackIds: [] },
  { id: 'ludwig-xxi', name: 'LUDWIG XXI', dayOfWeek: 3, trackIds: [] },
  { id: 'bulerias-silencio', name: 'Bulerías del Silencio', dayOfWeek: 3, trackIds: [] },

  // JUEVES (4): Trap espiritual y audiolibros
  { id: 'spiritual-trap', name: 'Spiritual Trap / Música Devocional Urbana', dayOfWeek: 4, trackIds: [] },
  { id: 'voz-del-tiempo', name: 'La voz del tiempo (Podcast y Audiolibros)', dayOfWeek: 4, trackIds: [] },

  // VIERNES (5): Guitarra y suites
  { id: 'suite-andalucia', name: 'Suite Andalucía', dayOfWeek: 5, trackIds: [] },
  { id: 'guitarra', name: 'Guitarra', dayOfWeek: 5, trackIds: [] },
  { id: 'romancero-vol-ii', name: 'Romancero del Toque Vivido, Vol. II', dayOfWeek: 5, trackIds: [] },

  // SÁBADO (6): Ópera y musical
  { id: 'opera-ombra', name: "Opera L'Ombra della Musica", dayOfWeek: 6, trackIds: [] },
  { id: 'pan-musical', name: 'PAN — EL MUSICAL', dayOfWeek: 6, trackIds: [] },

  // DOMINGO (0): Flamenco puro + selección aleatoria
  { id: 'flamenco-puro', name: 'Fandangos, Alegrías, Siguiriyas, Soleares, Tangos, Farrucas', dayOfWeek: 0, trackIds: [] },
];

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Obtiene el perfil del artista por su handle
 */
export async function getArtistProfile(): Promise<AudiusUser | null> {
  try {
    const url = `${API_BASE}/users/handle/${ARTIST_HANDLE}?app_name=${encodeURIComponent(APP_NAME)}&api_key=${AUDIUS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error('[Audius] Error fetching artist profile:', error);
    return null;
  }
}

/**
 * Obtiene un lote de pistas del artista con paginación
 */
export async function fetchTracksPage(
  limit: number = PAGE_SIZE,
  offset: number = 0
): Promise<AudiusTrack[]> {
  try {
    const url = `${API_BASE}/users/handle/${ARTIST_HANDLE}/tracks?limit=${limit}&offset=${offset}&app_name=${encodeURIComponent(APP_NAME)}&api_key=${AUDIUS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(`[Audius] Error fetching tracks (offset=${offset}):`, error);
    return [];
  }
}

/**
 * FASE 2.2: Obtiene TODAS las pistas del artista con paginación automática
 * Itera hasta que no haya más resultados
 */
export async function fetchAllArtistTracks(
  onProgress?: (loaded: number, total: number) => void
): Promise<AudiusTrack[]> {
  let allTracks: AudiusTrack[] = [];
  let offset = 0;
  let hasMore = true;
  let pageNum = 1;

  console.log('[Audius] 🚀 Iniciando ingesta completa del catálogo...');

  while (hasMore) {
    const tracks = await fetchTracksPage(PAGE_SIZE, offset);
    allTracks = [...allTracks, ...tracks];

    onProgress?.(allTracks.length, -1); // Total desconocido hasta el final

    if (tracks.length < PAGE_SIZE) {
      hasMore = false;
      console.log(`[Audius] ✅ Ingesta completa. Total: ${allTracks.length} pistas en ${pageNum} páginas`);
    } else {
      offset += PAGE_SIZE;
      pageNum++;
      // Pausa para respetar rate limits (10 req/s)
      await new Promise(resolve => setTimeout(resolve, 120));
    }
  }

  return allTracks;
}

/**
 * Obtiene las playlists/álbumes del artista
 */
export async function fetchArtistPlaylists(userId: string): Promise<any[]> {
  try {
    const url = `${API_BASE}/users/${userId}/playlists?app_name=${encodeURIComponent(APP_NAME)}&api_key=${AUDIUS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('[Audius] Error fetching playlists:', error);
    return [];
  }
}

// ============================================================================
// CLASIFICACIÓN Y ENRIQUECIMIENTO
// ============================================================================

/**
 * Clasifica una pista en una categoría temática basada en su metadata
 */
export function classifyTrack(track: AudiusTrack): TrackCategory {
  const title = (track.title || '').toLowerCase();
  const genre = (track.genre || '').toLowerCase();
  const tags = (track.tags || '').toLowerCase();
  const desc = (track.description || '').toLowerCase();
  const combined = `${title} ${genre} ${tags} ${desc}`;

  if (combined.match(/marcha|procesional|sacra|semana santa|pasión|gloria|utrera/)) return 'marchas';
  if (combined.match(/copla|sombra.*sangre|cadenas.*rosas/)) return 'copla';
  if (combined.match(/audiolibro|podcast|voz del tiempo|poesía|poesia|hablado|ensayo/)) return 'hablado';
  if (combined.match(/trap|spiritual|devocional|urbano/)) return 'trap';
  if (combined.match(/beethoven|ludwig|sinfon|suite|opera|ópera|musical|orchestra|romancero|pan/)) return 'sinfonica';
  if (combined.match(/flamenco|bulería|buleria|soleá|solea|siguiri|fandango|alegría|alegria|tangos|farruca|saeta|jaleo/)) return 'flamenco';
  if (combined.match(/guitarra|guitar/)) return 'guitarra';
  if (combined.match(/electrón|electron|petal|black|ambient|electronic/)) return 'electronica';

  return 'general';
}

/**
 * Asigna pistas a álbumes basándose en matching de título
 */
export function assignTracksToAlbums(tracks: AudiusTrack[], albums: Album[]): AudiusTrack[] {
  return tracks.map(track => {
    const title = (track.title || '').toLowerCase();
    const desc = (track.description || '').toLowerCase();
    const combined = `${title} ${desc}`;

    // Intentar match con álbumes definidos
    for (const album of albums) {
      const albumKeywords = album.name.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
      const matchCount = albumKeywords.filter(kw => combined.includes(kw)).length;
      
      if (matchCount >= 2 || (albumKeywords.length <= 3 && matchCount >= 1)) {
        return { ...track, albumId: album.id };
      }
    }

    // Fallback: clasificar por categoría y asignar a álbum genérico
    const category = classifyTrack(track);
    const categoryAlbumMap: Record<string, string> = {
      marchas: 'marchas-vol-ix',
      copla: 'coplas-sombra',
      flamenco: 'flamenco-puro',
      trap: 'spiritual-trap',
      sinfonica: 'bulerias-silencio',
      electronica: 'black-petals',
      hablado: 'voz-del-tiempo',
      guitarra: 'guitarra',
      general: 'suite-andalucia',
    };

    return { ...track, albumId: categoryAlbumMap[category] || 'suite-andalucia' };
  });
}

/**
 * Construye el catálogo completo enriquecido
 */
export function buildCatalog(
  artist: AudiusUser | null,
  rawTracks: AudiusTrack[]
): Catalog {
  // Clonar definiciones de álbumes
  const albums: Album[] = ALBUM_DEFINITIONS.map(a => ({ ...a, trackIds: [] as string[] }));

  // Asignar pistas a álbumes
  const enrichedTracks = assignTracksToAlbums(rawTracks, albums);

  // Poblar trackIds de cada álbum
  for (const track of enrichedTracks) {
    if (track.albumId) {
      const album = albums.find(a => a.id === track.albumId);
      if (album) {
        album.trackIds.push(track.id);
      }
    }
  }

  return {
    artist,
    tracks: enrichedTracks,
    albums,
    lastUpdated: new Date().toISOString(),
    totalTracks: enrichedTracks.length,
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Construye la URL de stream para una pista
 */
export function getStreamUrl(trackId: string): string {
  return `${API_BASE}/tracks/${trackId}/stream?app_name=${encodeURIComponent(APP_NAME)}&api_key=${AUDIUS_API_KEY}`;
}

/**
 * Obtiene la URL de la imagen de portada
 */
export function getTrackArtwork(track: AudiusTrack, size: '150x150' | '480x480' | '1000x1000' = '480x480'): string {
  if (track.artwork) return track.artwork;
  if (track.cover_art) return track.cover_art;
  if (track.cover_art_sizes) {
    return `https://discoveryprovider.audius.co/image/cidmatch/${track.cover_art_sizes}?size=${size}`;
  }
  return '';
}

/**
 * Formatea segundos a mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// LABELS Y COLORES PARA UI
// ============================================================================

export const CATEGORY_LABELS: Record<TrackCategory, string> = {
  marchas: 'Marchas Procesionales',
  copla: 'Copla Española',
  flamenco: 'Flamenco',
  trap: 'Trap Espiritual',
  sinfonica: 'Música Sinfónica',
  electronica: 'Electrónica',
  hablado: 'Poesía / Audiolibro',
  guitarra: 'Guitarra Flamenca',
  general: 'Variado',
};

export const CATEGORY_COLORS: Record<TrackCategory, string> = {
  marchas: 'from-amber-500 to-orange-600',
  copla: 'from-rose-500 to-red-600',
  flamenco: 'from-orange-500 to-red-700',
  trap: 'from-cyan-500 to-blue-600',
  sinfonica: 'from-purple-500 to-indigo-600',
  electronica: 'from-blue-500 to-violet-600',
  hablado: 'from-indigo-600 to-purple-800',
  guitarra: 'from-emerald-500 to-teal-600',
  general: 'from-slate-500 to-slate-700',
};

export const CATEGORY_BADGE: Record<TrackCategory, string> = {
  marchas: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  copla: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  flamenco: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  trap: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  sinfonica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  electronica: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  hablado: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  guitarra: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  general: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
