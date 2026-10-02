// Audius API Service for "El Hombre de las Nubes" Radio
const API_BASE = 'https://api.audius.co/v1';
const APP_NAME = 'Radio El Hombre de las Nubes';

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
    profile_picture?: string | null;
    profile_picture_sizes?: string | null;
  };
  stream?: { url: string } | null;
}

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  bio: string;
  follower_count: number;
  track_count: number;
  album_count: number;
  profile_picture?: string | null;
  profile_picture_sizes?: string | null;
  cover_photo?: string | null;
  cover_photo_sizes?: string | null;
  is_verified: boolean;
  location?: string;
  website?: string;
}

function getImageUrl(cid: string | null | undefined, size: string = '480x480'): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  return `https://discoveryprovider.audius.co/image/cidmatch/${cid}?size=${size}`;
}

export async function getUserByHandle(handle: string): Promise<AudiusUser | null> {
  try {
    const res = await fetch(`${API_BASE}/users/handle/${handle}?app_name=${encodeURIComponent(APP_NAME)}`);
    const json = await res.json();
    if (json.data) return json.data;
    return null;
  } catch (e) {
    console.error('Error fetching user:', e);
    return null;
  }
}

export async function getUserTracks(handle: string, limit: number = 100, offset: number = 0): Promise<AudiusTrack[]> {
  try {
    const res = await fetch(
      `${API_BASE}/users/handle/${handle}/tracks?limit=${limit}&offset=${offset}&app_name=${encodeURIComponent(APP_NAME)}`
    );
    const json = await res.json();
    if (json.data) return json.data;
    return [];
  } catch (e) {
    console.error('Error fetching tracks:', e);
    return [];
  }
}

export async function getAllTracks(handle: string): Promise<AudiusTrack[]> {
  let allTracks: AudiusTrack[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const tracks = await getUserTracks(handle, limit, offset);
    allTracks = [...allTracks, ...tracks];
    if (tracks.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allTracks;
}

export async function getTrackStreamUrl(trackId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/tracks/${trackId}/stream?app_name=${encodeURIComponent(APP_NAME)}`
    );
    if (res.ok) {
      return res.url;
    }
    return null;
  } catch (e) {
    console.error('Error getting stream URL:', e);
    return null;
  }
}

export function getTrackArtwork(track: AudiusTrack): string {
  if (track.artwork) return track.artwork;
  if (track.cover_art) return track.cover_art;
  if (track.cover_art_sizes) return getImageUrl(track.cover_art_sizes);
  return '';
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Genre classification for thematic programming
export function classifyTrack(track: AudiusTrack): string {
  const title = (track.title || '').toLowerCase();
  const genre = (track.genre || '').toLowerCase();
  const tags = (track.tags || '').toLowerCase();
  const desc = (track.description || '').toLowerCase();
  const combined = `${title} ${genre} ${tags} ${desc}`;

  if (combined.includes('marcha') || combined.includes('procesional') || combined.includes('sacra') || combined.includes('semana santa')) {
    return 'marchas';
  }
  if (combined.includes('copla') || combined.includes('sombra') || combined.includes('sangre')) {
    return 'copla';
  }
  if (combined.includes('flamenco') || combined.includes('bulería') || combined.includes('buleria') || 
      combined.includes('soleá') || combined.includes('solea') || combined.includes('siguiri') ||
      combined.includes('fandango') || combined.includes('alegría') || combined.includes('alegria') ||
      combined.includes('tangos') || combined.includes('farruca') || combined.includes('saeta')) {
    return 'flamenco';
  }
  if (combined.includes('trap') || combined.includes('spiritual') || combined.includes('devocional')) {
    return 'trap';
  }
  if (combined.includes('beethoven') || combined.includes('ludwig') || combined.includes('sinfón') || 
      combined.includes('sinfon') || combined.includes('suite') || combined.includes('opera') || 
      combined.includes('ópera') || combined.includes('musical') || combined.includes('orchestra')) {
    return 'sinfonica';
  }
  if (combined.includes('electrón') || combined.includes('electron') || combined.includes('petal') ||
      combined.includes('black') || combined.includes('electronic')) {
    return 'electronica';
  }
  if (combined.includes('audiolibro') || combined.includes('podcast') || combined.includes('voz') ||
      combined.includes('poesía') || combined.includes('poesia') || combined.includes('hablado')) {
    return 'hablado';
  }
  if (combined.includes('guitarra') || combined.includes('guitar')) {
    return 'guitarra';
  }
  return 'general';
}

// Thematic programming blocks
export interface ProgramBlock {
  name: string;
  description: string;
  genres: string[];
  icon: string;
  startHour: number;
  endHour: number;
  color: string;
}

export const PROGRAM_BLOCKS: ProgramBlock[] = [
  {
    name: 'Amanecer Sacro',
    description: 'Marchas procesionales para despertar el alma',
    genres: ['marchas'],
    icon: '☀️',
    startHour: 6,
    endHour: 10,
    color: 'from-amber-500 to-orange-600'
  },
  {
    name: 'Mañana de Copla',
    description: 'Copla española dramática y contemporánea',
    genres: ['copla'],
    icon: '🌹',
    startHour: 10,
    endHour: 13,
    color: 'from-rose-500 to-red-600'
  },
  {
    name: 'Mediodía Flamenca',
    description: 'Flamenco, bulerías y cantes al mediodía',
    genres: ['flamenco', 'guitarra'],
    icon: '🔥',
    startHour: 13,
    endHour: 16,
    color: 'from-orange-500 to-red-700'
  },
  {
    name: 'Tarde Sinfónica',
    description: 'Obras sinfónicas y reinterpretaciones clásicas',
    genres: ['sinfonica'],
    icon: '🎼',
    startHour: 16,
    endHour: 19,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    name: 'Atardecer Electrónico',
    description: 'Flamenco barroco con electrónica y ambient',
    genres: ['electronica', 'trap'],
    icon: '⚡',
    startHour: 19,
    endHour: 22,
    color: 'from-cyan-500 to-blue-600'
  },
  {
    name: 'Noche de Poesía',
    description: 'Audiolibros, poesía hablada y ensayos sonoros',
    genres: ['hablado'],
    icon: '🌙',
    startHour: 22,
    endHour: 1,
    color: 'from-indigo-600 to-purple-800'
  },
  {
    name: 'Madrugada en Silencio',
    description: 'Selección variada del catálogo completo',
    genres: ['general', 'marchas', 'flamenco', 'copla', 'sinfonica', 'electronica', 'trap', 'guitarra'],
    icon: '✨',
    startHour: 1,
    endHour: 6,
    color: 'from-slate-600 to-slate-800'
  }
];

export function getCurrentBlock(): ProgramBlock {
  const hour = new Date().getHours();
  return PROGRAM_BLOCKS.find(block => {
    if (block.startHour < block.endHour) {
      return hour >= block.startHour && hour < block.endHour;
    } else {
      return hour >= block.startHour || hour < block.endHour;
    }
  }) || PROGRAM_BLOCKS[PROGRAM_BLOCKS.length - 1];
}

export function filterTracksByBlock(tracks: AudiusTrack[], block: ProgramBlock): AudiusTrack[] {
  const filtered = tracks.filter(track => {
    const category = classifyTrack(track);
    return block.genres.includes(category);
  });
  
  // If no tracks match, return all tracks (fallback)
  return filtered.length > 0 ? filtered : tracks;
}
