/**
 * Estado global de la radio con Zustand
 * Maneja: pista actual, cola, historial, reproducción, volumen, metadatos
 */

import { create } from 'zustand';
import { AudiusTrack, TrackCategory, classifyTrack, getStreamUrl } from '../lib/audius';
import { ScheduleBlock, generateQueue, getCurrentBlock } from '../lib/scheduler';

export type RadioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'tts' | 'error';

interface RadioState {
  // Estado de la radio
  status: RadioStatus;
  isInitialized: boolean;
  
  // Pista actual
  currentTrack: AudiusTrack | null;
  streamUrl: string | null;
  
  // Cola y historial
  queue: AudiusTrack[];
  history: AudiusTrack[];
  playedIds: Set<string>;
  
  // Programación
  currentBlock: ScheduleBlock;
  
  // Reproducción
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  
  // Metadatos
  totalTracks: number;
  tracksPlayed: number;
  
  // Errores
  error: string | null;
  
  // Acciones
  initialize: (tracks: AudiusTrack[]) => void;
  setCurrentTrack: (track: AudiusTrack | null) => void;
  setStatus: (status: RadioStatus) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setError: (error: string | null) => void;
  
  // Cola
  playNext: () => AudiusTrack | null;
  addToHistory: (track: AudiusTrack) => void;
  rebuildQueue: () => void;
  
  // Playback
  play: () => void;
  pause: () => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  // Estado inicial
  status: 'idle',
  isInitialized: false,
  currentTrack: null,
  streamUrl: null,
  queue: [],
  history: [],
  playedIds: new Set<string>(),
  currentBlock: getCurrentBlock(),
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  totalTracks: 0,
  tracksPlayed: 0,
  error: null,
  
  // Inicializar con las pistas cargadas
  initialize: (tracks: AudiusTrack[]) => {
    const block = getCurrentBlock();
    const initialQueue = generateQueue(tracks, block);
    
    set({
      isInitialized: true,
      totalTracks: tracks.length,
      queue: initialQueue,
      currentBlock: block,
      status: 'idle',
    });
  },
  
  setCurrentTrack: (track) => {
    const streamUrl = track ? getStreamUrl(track.id) : null;
    set({ currentTrack: track, streamUrl, progress: 0, duration: 0, error: null });
  },
  
  setStatus: (status) => set({ status }),
  
  setProgress: (progress) => set({ progress }),
  
  setDuration: (duration) => set({ duration }),
  
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  
  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      set({ isMuted: false, volume: volume || 0.8 });
    } else {
      set({ isMuted: true });
    }
  },
  
  setError: (error) => set({ error, status: error ? 'error' : get().status }),
  
  // Obtener siguiente pista de la cola
  playNext: () => {
    const { queue, playedIds, totalTracks } = get();
    
    if (queue.length === 0) {
      // Reconstruir cola
      get().rebuildQueue();
      const newQueue = get().queue;
      if (newQueue.length > 0) {
        const nextTrack = newQueue[0];
        set({ 
          queue: newQueue.slice(1),
          playedIds: new Set([...playedIds, nextTrack.id]),
        });
        return nextTrack;
      }
      return null;
    }
    
    const nextTrack = queue[0];
    set({ 
      queue: queue.slice(1),
      playedIds: new Set([...playedIds, nextTrack.id]),
    });
    
    return nextTrack;
  },
  
  addToHistory: (track) => {
    const { history, tracksPlayed } = get();
    set({ 
      history: [track, ...history].slice(0, 50), // Mantener últimas 50
      tracksPlayed: tracksPlayed + 1,
    });
  },
  
  rebuildQueue: () => {
    const { playedIds } = get();
    
    // Obtener todas las pistas del catálogo (necesitamos acceder a ellas)
    // Usamos las pistas del historial como referencia del catálogo completo
    const block = getCurrentBlock();
    
    // Si tenemos historial, usar esas pistas para regenerar
    const { history, totalTracks } = get();
    
    // Reset de IDs reproducidos si hemos reproducido muchas
    if (playedIds.size > totalTracks * 0.8) {
      set({ playedIds: new Set() });
    }
    
    // Generar nueva cola con las pistas disponibles
    // Nota: necesitamos acceso al catálogo completo aquí
    // Lo resolvemos pasando las pistas como parámetro desde el componente
  },
  
  play: () => set({ status: 'playing' }),
  
  pause: () => set({ status: 'paused' }),
}));

/**
 * Hook para reconstruir la cola con el catálogo completo
 */
export function useRebuildQueue(tracks: AudiusTrack[]) {
  const { playedIds, currentBlock } = useRadioStore();
  
  return () => {
    const block = getCurrentBlock();
    const shouldReset = playedIds.size > tracks.length * 0.8;
    const excludeIds: Set<string> = shouldReset ? new Set<string>() : playedIds;
    const newQueue = generateQueue(tracks, block, excludeIds);
    
    useRadioStore.setState({ 
      queue: newQueue,
      currentBlock: block,
      playedIds: shouldReset ? new Set<string>() : playedIds,
    });
  };
}
