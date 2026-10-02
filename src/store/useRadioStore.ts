/**
 * ============================================================================
 * FASE 4: MOTOR DE REPRODUCCIÓN CONTINUA - ESTADO GLOBAL
 * ============================================================================
 * Zustand store con soporte para QueueItem (tracks + TTS markers),
 * timeout de seguridad, manejo de errores y regeneración automática.
 */

import { create } from 'zustand';
import { AudiusTrack, Album, getStreamUrl } from '../lib/audius';
import { QueueItem, ScheduleBlock, getCurrentBlock, generateQueue } from '../lib/scheduler';
import { logTrack, logTTS, logQueue, logError } from '../lib/logger';
import { savePlayedIds, loadPlayedIds } from '../lib/persistence';

export type RadioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'tts' | 'error';

interface RadioState {
  // Catálogo
  catalog: AudiusTrack[];
  albums: Album[];
  isCatalogLoaded: boolean;

  // Estado de la radio
  status: RadioStatus;

  // Cola (QueueItem = track | tts)
  queue: QueueItem[];
  currentIndex: number;

  // Pista actual (solo si el item es track)
  currentTrack: AudiusTrack | null;
  currentTTSMessage: string | null;
  streamUrl: string | null;

  // Reproducción
  isPlaying: boolean;
  isTTSPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;

  // Programación
  currentBlock: ScheduleBlock;

  // Historial y tracking
  playedIds: Set<string>;
  tracksPlayedCount: number;
  ttsPlayedCount: number;
  errorCount: number;

  // Errores
  error: string | null;

  // Acciones - Catálogo
  setCatalog: (tracks: AudiusTrack[], albums: Album[]) => void;

  // Acciones - Cola
  setQueue: (queue: QueueItem[]) => void;
  regenerateQueue: () => void;

  // Acciones - Reproducción
  playCurrentItem: () => void;
  advanceToNext: () => QueueItem | null;
  setCurrentTrack: (track: AudiusTrack) => void;
  setCurrentTTS: (message: string) => void;
  clearCurrentItem: () => void;

  // Acciones - Estado
  setStatus: (status: RadioStatus) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsTTSPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setError: (error: string | null) => void;
  setCurrentBlock: (block: ScheduleBlock) => void;

  // Acciones - Tracking
  markTrackPlayed: (trackId: string) => void;
  incrementTTSCount: () => void;
  incrementErrorCount: () => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  // Estado inicial
  catalog: [],
  albums: [],
  isCatalogLoaded: false,
  status: 'idle',
  queue: [],
  currentIndex: 0,
  currentTrack: null,
  currentTTSMessage: null,
  streamUrl: null,
  isPlaying: false,
  isTTSPlaying: false,
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  currentBlock: getCurrentBlock(),
  playedIds: loadPlayedIds(),
  tracksPlayedCount: 0,
  ttsPlayedCount: 0,
  errorCount: 0,
  error: null,

  // === ACCIONES ===

  setCatalog: (tracks, albums) => {
    set({ catalog: tracks, albums, isCatalogLoaded: true });
    logQueue(`Catálogo cargado: ${tracks.length} pistas, ${albums.length} álbumes`);
  },

  setQueue: (queue) => {
    set({ queue, currentIndex: 0 });
    logQueue(`Nueva cola establecida: ${queue.length} items`);
  },

  regenerateQueue: () => {
    const { catalog, albums, currentBlock, playedIds } = get();
    const block = getCurrentBlock();
    
    // Reset de exclusiones si hemos reproducido mucho
    const shouldReset = playedIds.size > catalog.length * 0.8;
    const excludeIds = shouldReset ? new Set<string>() : playedIds;

    const newQueue = generateQueue(catalog, albums, block, excludeIds);
    
    set({
      queue: newQueue,
      currentIndex: 0,
      currentBlock: block,
      playedIds: shouldReset ? new Set() : playedIds,
    });

    if (shouldReset) {
      savePlayedIds(new Set());
      logQueue('Cola regenerada con reset de exclusiones');
    } else {
      logQueue(`Cola regenerada: ${newQueue.length} items (bloque: ${block.name})`);
    }
  },

  playCurrentItem: () => {
    const { queue, currentIndex } = get();
    if (currentIndex >= queue.length) {
      get().regenerateQueue();
      return;
    }

    const item = queue[currentIndex];
    if (!item) {
      get().regenerateQueue();
      return;
    }

    if (item.type === 'track') {
      const track = item.track;
      const streamUrl = getStreamUrl(track.id);
      set({
        currentTrack: track,
        currentTTSMessage: null,
        streamUrl,
        status: 'playing',
        isPlaying: true,
        isTTSPlaying: false,
        progress: 0,
        duration: track.duration,
        error: null,
      });
      logTrack(`Reproduciendo: "${track.title}"`, { id: track.id, duration: track.duration });
    } else if (item.type === 'tts') {
      set({
        currentTrack: null,
        currentTTSMessage: item.message,
        streamUrl: null,
        status: 'tts',
        isPlaying: false,
        isTTSPlaying: true,
      });
      logTTS(`Locución TTS: "${item.message}"`);
    }
  },

  advanceToNext: () => {
    const { queue, currentIndex, playedIds } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      // Cola agotada - regenerar
      logQueue('Cola agotada, regenerando...');
      get().regenerateQueue();
      const newQueue = get().queue;
      if (newQueue.length > 0) {
        set({ currentIndex: 0 });
        return newQueue[0];
      }
      return null;
    }

    set({ currentIndex: nextIndex });
    return queue[nextIndex];
  },

  setCurrentTrack: (track) => {
    const streamUrl = getStreamUrl(track.id);
    set({
      currentTrack: track,
      currentTTSMessage: null,
      streamUrl,
      status: 'playing',
      isPlaying: true,
      isTTSPlaying: false,
      progress: 0,
      duration: track.duration,
      error: null,
    });
  },

  setCurrentTTS: (message) => {
    set({
      currentTrack: null,
      currentTTSMessage: message,
      streamUrl: null,
      status: 'tts',
      isPlaying: false,
      isTTSPlaying: true,
    });
  },

  clearCurrentItem: () => {
    set({
      currentTrack: null,
      currentTTSMessage: null,
      streamUrl: null,
      isPlaying: false,
      isTTSPlaying: false,
    });
  },

  setStatus: (status) => set({ status }),
  setIsPlaying: (isPlaying) => set({ isPlaying, status: isPlaying ? 'playing' : 'paused' }),
  setIsTTSPlaying: (isTTSPlaying) => set({ isTTSPlaying, status: isTTSPlaying ? 'tts' : 'paused' }),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => {
    const { isMuted, volume } = get();
    set({ isMuted: !isMuted, volume: isMuted ? (volume || 0.8) : 0 });
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setError: (error) => {
    set({ error });
    if (error) logError(error);
  },
  setCurrentBlock: (block) => set({ currentBlock: block }),

  markTrackPlayed: (trackId) => {
    const { playedIds, tracksPlayedCount } = get();
    const newPlayedIds = new Set(playedIds);
    newPlayedIds.add(trackId);
    set({ playedIds: newPlayedIds, tracksPlayedCount: tracksPlayedCount + 1 });
    savePlayedIds(newPlayedIds);
  },

  incrementTTSCount: () => {
    const { ttsPlayedCount } = get();
    set({ ttsPlayedCount: ttsPlayedCount + 1 });
  },

  incrementErrorCount: () => {
    const { errorCount } = get();
    set({ errorCount: errorCount + 1 });
  },
}));
