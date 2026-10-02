/**
 * Servicio de Audius API
 * Obtiene todas las pistas del catálogo del Prof. Manuel Gago Fernández (@profmanuelgago)
 * con paginación automática para manejar catálogos grandes (>500 pistas)
 */

const API_BASE = 'https://api.audius.co/v1';
const APP_NAME = 'Radio El Hombre de las Nubes';
const ARTIST_HANDLE = 'profmanuelgago';

// Tipos de datos de Audius
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
}

export interface AudiusPlaylist {
  id: string;
  playlist_name: string;
  description?: string;
  artwork?: string | null;
  track_count: number;
}

/**
 * Obtiene el perfil del artista por su handle
 */
export async function getArtistProfile(): Promise<AudiusUser | null> {
  try {
    const res = await fetch(
      `${API_BASE}/users/handle/${ARTIST_HANDLE}?app_name=${encodeURIComponent(APP_NAME)}`
    );
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error('[Audius] Error fetching artist profile:', error);
    return null;
  }
}

/**
 * Obtiene pistas del artista con paginación
 */
export async function getArtistTracks(
  limit: number = 100,
  offset: number = 0
): Promise<AudiusTrack[]> {
  try {
    const res = await fetch(
      `${API_BASE}/users/handle/${ARTIST_HANDLE}/tracks?limit=${limit}&offset=${offset}&app_name=${encodeURIComponent(APP_NAME)}`
    );
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('[Audius] Error fetching tracks:', error);
    return [];
  }
}

/**
 * Obtiene TODAS las pistas del artista con paginación automática
 * Maneja catálogos de cualquier tamaño
 */
export async function getAllArtistTracks(): Promise<AudiusTrack[]> {
  let allTracks: AudiusTrack[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let pageNum = 1;

  console.log('[Audius] Iniciando carga completa del catálogo...');

  while (hasMore) {
    console.log(`[Audius] Cargando página ${pageNum} (offset: ${offset})...`);
    const tracks = await getArtistTracks(limit, offset);
    
    allTracks = [...allTracks, ...tracks];
    console.log(`[Audius] Página ${pageNum}: ${tracks.length} pistas obtenidas`);
    
    if (tracks.length < limit) {
      hasMore = false;
      console.log(`[Audius] Carga completa. Total: ${allTracks.length} pistas`);
    } else {
      offset += limit;
      pageNum++;
    }
    
    // Pequeña pausa para no saturar la API
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return allTracks;
}

/**
 * Obtiene las playlists/álbumes del artista
 */
export async function getArtistPlaylists(): Promise<AudiusPlaylist[]> {
  try {
    // Primero necesitamos el user ID
    const user = await getArtistProfile();
    if (!user) return [];

    const res = await fetch(
      `${API_BASE}/users/${user.id}/playlists?app_name=${encodeURIComponent(APP_NAME)}`
    );
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('[Audius] Error fetching playlists:', error);
    return [];
  }
}

/**
 * Construye la URL de stream para una pista
 */
export function getStreamUrl(trackId: string): string {
  return `${API_BASE}/tracks/${trackId}/stream?app_name=${encodeURIComponent(APP_NAME)}`;
}

/**
 * Obtiene la URL de la imagen de portada de una pista
 */
export function getTrackArtwork(track: AudiusTrack): string {
  if (track.artwork) return track.artwork;
  if (track.cover_art) return track.cover_art;
  if (track.cover_art_sizes) {
    return `https://discoveryprovider.audius.co/image/cidmatch/${track.cover_art_sizes}?size=480x480`;
  }
  return '';
}

/**
 * Formatea segundos a formato mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clasifica una pista en una categoría temática basada en su metadata
 */
export function classifyTrack(track: AudiusTrack): TrackCategory {
  const title = (track.title || '').toLowerCase();
  const genre = (track.genre || '').toLowerCase();
  const tags = (track.tags || '').toLowerCase();
  const desc = (track.description || '').toLowerCase();
  const combined = `${title} ${genre} ${tags} ${desc}`;

  // Clasificación por prioridad
  if (combined.match(/marcha|procesional|sacra|semana santa|pasión|gloria/)) {
    return 'marchas';
  }
  if (combined.match(/copla|sombra.*sangre|cadenas.*rosas/)) {
    return 'copla';
  }
  if (combined.match(/audiolibro|podcast|voz del tiempo|poesía|poesia|hablado|ensayo/)) {
    return 'hablado';
  }
  if (combined.match(/trap|spiritual|devocional|urbano/)) {
    return 'trap';
  }
  if (combined.match(/beethoven|ludwig|sinfon|suite|opera|ópera|musical|orchestra|romancero/)) {
    return 'sinfonica';
  }
  if (combined.match(/flamenco|bulería|buleria|soleá|solea|siguiri|fandango|alegría|alegria|tangos|farruca|saeta|jaleo/)) {
    return 'flamenco';
  }
  if (combined.match(/guitarra|guitar/)) {
    return 'guitarra';
  }
  if (combined.match(/electrón|electron|petal|black|ambient|electronic/)) {
    return 'electronica';
  }
  
  return 'general';
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
