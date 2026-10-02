import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudiusTrack,
  AudiusUser,
  getAllTracks,
  getUserByHandle,
  getTrackArtwork,
  formatDuration,
  classifyTrack,
  getCurrentBlock,
  filterTracksByBlock,
  ProgramBlock,
} from './services/audius';

function App() {
  const [user, setUser] = useState<AudiusUser | null>(null);
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudiusTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBlock, setCurrentBlock] = useState<ProgramBlock>(getCurrentBlock());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [queue, setQueue] = useState<AudiusTrack[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<AudiusTrack[]>([]);
  const playedRef = useRef<Set<string>>(new Set());

  const ARTIST_HANDLE = 'profmanuelgago';

  // Keep refs in sync
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { playedRef.current = playedIds; }, [playedIds]);

  // Load tracks on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [userData, allTracks] = await Promise.all([
          getUserByHandle(ARTIST_HANDLE),
          getAllTracks(ARTIST_HANDLE),
        ]);
        setUser(userData);
        setTracks(allTracks);
        if (allTracks.length === 0) {
          setError('No se pudieron cargar las pistas. Intenta de nuevo más tarde.');
        }
      } catch (e) {
        console.error('Error loading data:', e);
        setError('Error de conexión con Audius. Reintentando...');
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Update current block every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBlock(getCurrentBlock());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Build queue based on current programming block
  const buildQueue = useCallback(() => {
    if (tracks.length === 0) return [];
    const block = getCurrentBlock();
    const filtered = filterTracksByBlock(tracks, block);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [tracks]);

  useEffect(() => {
    if (tracks.length > 0 && queue.length === 0) {
      const newQueue = buildQueue();
      setQueue(newQueue);
    }
  }, [tracks, queue.length, buildQueue]);

  // Play a specific track
  const playTrack = useCallback(async (track: AudiusTrack) => {
    setCurrentTrack(track);
    setError(null);
    setPlayedIds(prev => {
      const next = new Set(prev);
      next.add(track.id);
      return next;
    });
    
    const url = `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=${encodeURIComponent('Radio El Hombre de las Nubes')}`;
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Error playing:', e);
        setIsPlaying(false);
      }
    }
  }, [volume]);

  // Play next track from queue
  const playNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentPlayed = playedRef.current;
    
    if (currentQueue.length === 0) {
      // Rebuild queue
      if (tracks.length > 0) {
        const block = getCurrentBlock();
        const filtered = filterTracksByBlock(tracks, block);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
        if (shuffled.length > 0) {
          setTimeout(() => playTrack(shuffled[0]), 200);
        }
      }
      return;
    }
    
    // Find next unplayed track
    let nextTrack = currentQueue.find(t => !currentPlayed.has(t.id));
    if (!nextTrack) {
      // All tracks played, reset and rebuild
      setPlayedIds(new Set());
      const block = getCurrentBlock();
      const filtered = filterTracksByBlock(tracks, block);
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      if (shuffled.length > 0) {
        nextTrack = shuffled[0];
      }
    }
    
    if (nextTrack) {
      setQueue(prev => prev.filter(t => t.id !== nextTrack!.id));
      playTrack(nextTrack);
    }
  }, [tracks, playTrack]);

  // Progress tracking
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
        }
      }, 500);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  // Auto-play next when track ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      playNext();
    };

    const handleError = () => {
      // Skip to next track on error
      setTimeout(() => playNext(), 1000);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playNext]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (!currentTrack) {
      if (queue.length > 0) {
        const first = queue[0];
        setQueue(prev => prev.slice(1));
        await playTrack(first);
      }
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Play error:', e);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const genreColors: Record<string, string> = {
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

  const genreLabels: Record<string, string> = {
    marchas: 'Marchas Procesionales',
    copla: 'Copla',
    flamenco: 'Flamenco',
    trap: 'Trap Espiritual',
    sinfonica: 'Sinfónica',
    electronica: 'Electrónica',
    hablado: 'Poesía / Audiolibro',
    guitarra: 'Guitarra',
    general: 'General',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping"></div>
            <div className="absolute inset-3 rounded-full border-4 border-purple-400/30 animate-pulse"></div>
            <div className="absolute inset-6 rounded-full border-4 border-indigo-400/20 animate-pulse" style={{ animationDelay: '500ms' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-3xl">☁️</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl text-purple-200 font-light mb-2">
            Sintonizando El Hombre de las Nubes...
          </h2>
          <p className="text-sm text-purple-400/70">Cargando catálogo completo desde Audius</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1.5 bg-purple-400 rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 20}px`,
                  animationDelay: `${i * 150}ms`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

      {/* Background animated elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentBlock.color} opacity-[0.07] transition-all duration-[5000ms]`}></div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-pink-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl animate-bounce" style={{ animationDuration: '3s' }}>☁️</span>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
              Radio El Hombre de las Nubes
            </h1>
            <span className="text-3xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>📻</span>
          </div>
          <p className="text-purple-300/70 text-sm max-w-md mx-auto">
            Emisora autónoma 24/7 • Catálogo completo del Prof. Manuel Gago Fernández
          </p>
          {user && (
            <div className="flex items-center justify-center gap-3 mt-3 text-xs text-purple-400/60">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                {tracks.length} pistas
              </span>
              <span className="text-purple-500/40">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                {user.follower_count} seguidores
              </span>
              <span className="text-purple-500/40">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                {user.album_count} álbumes
              </span>
            </div>
          )}
        </header>

        {/* Current Program Block */}
        <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-r ${currentBlock.color} bg-opacity-10 backdrop-blur-sm border border-white/10 shadow-lg`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentBlock.icon}</span>
              <div>
                <h3 className="font-bold text-white text-lg">{currentBlock.name}</h3>
                <p className="text-xs text-white/60">{currentBlock.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">En emisión</div>
              <div className="text-sm font-mono text-white/70">
                {String(currentBlock.startHour).padStart(2, '0')}:00 — {String(currentBlock.endHour).padStart(2, '0')}:00h
              </div>
            </div>
          </div>
        </div>

        {/* Player Section */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6">
          <div className="w-full max-w-lg">
            {currentTrack ? (
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
                {/* Vinyl Artwork */}
                <div className="relative mx-auto w-52 h-52 md:w-64 md:h-64 mb-8">
                  {/* Glow effect */}
                  <div className={`absolute inset-[-20px] rounded-full bg-gradient-to-br ${currentBlock.color} opacity-30 blur-2xl ${isPlaying ? 'animate-pulse' : 'opacity-10'}`}></div>
                  
                  {/* Vinyl disc */}
                  <div className={`relative w-full h-full rounded-full overflow-hidden border-[3px] border-white/10 shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    {getTrackArtwork(currentTrack) ? (
                      <img
                        src={getTrackArtwork(currentTrack)}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${getTrackArtwork(currentTrack) ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 flex items-center justify-center`}>
                      <span className="text-7xl opacity-80">☁️</span>
                    </div>
                    {/* Vinyl grooves overlay */}
                    <div className="absolute inset-0 rounded-full" style={{
                      background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)'
                    }}></div>
                  </div>
                  
                  {/* Center hole */}
                  <div className="absolute inset-[38%] rounded-full bg-slate-900/90 border-2 border-white/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  </div>
                </div>

                {/* Track info */}
                <div className="text-center mb-5">
                  <h2 className="text-lg md:text-xl font-bold text-white truncate px-4 leading-tight">
                    {currentTrack.title}
                  </h2>
                  <p className="text-purple-300/80 text-sm mt-1.5 font-medium">Prof. Manuel Gago Fernández</p>
                  <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] border font-medium ${genreColors[classifyTrack(currentTrack)] || genreColors.general}`}>
                      {genreLabels[classifyTrack(currentTrack)] || 'General'}
                    </span>
                    {currentTrack.bpm && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-white/50 border border-white/10">
                        ♫ {currentTrack.bpm} BPM
                      </span>
                    )}
                    {currentTrack.duration && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-white/50 border border-white/10">
                        ⏱ {formatDuration(currentTrack.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div
                    className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group"
                    onClick={seekTo}
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${currentBlock.color} rounded-full transition-all duration-300 relative`}
                      style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-white/40 mt-1.5 font-mono">
                    <span>{formatDuration(progress)}</span>
                    <span>-{formatDuration(Math.max(0, (duration || currentTrack.duration) - progress))}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={playNext}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
                    title="Siguiente pista"
                  >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className={`p-5 md:p-6 rounded-full bg-gradient-to-br ${currentBlock.color} hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? (
                      <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group relative"
                    title="Cola de reproducción"
                  >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[9px] flex items-center justify-center font-bold">
                        {queue.length > 9 ? '9+' : queue.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center justify-center gap-3 mt-5">
                  <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-28 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-white/10 text-center shadow-2xl">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 blur-xl animate-pulse"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-xl">
                    <span className="text-5xl">☁️</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Radio El Hombre de las Nubes</h2>
                <p className="text-purple-300/60 text-sm mb-2 max-w-sm mx-auto">
                  Emisora digital autónoma con el catálogo completo del Prof. Manuel Gago Fernández en Audius
                </p>
                <p className="text-purple-400/40 text-xs mb-8">
                  Flamenco • Copla • Marchas • Sinfónica • Electrónica • Trap Espiritual
                </p>
                <button
                  onClick={togglePlay}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 font-semibold text-lg transform hover:scale-105 active:scale-95"
                >
                  ▶ Encender Radio
                </button>
                {tracks.length > 0 && (
                  <p className="text-xs text-purple-400/40 mt-4">
                    {tracks.length} pistas disponibles para reproducir
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Equalizer animation when playing */}
          {isPlaying && (
            <div className="flex items-end justify-center gap-[3px] mt-6 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-gradient-to-t ${currentBlock.color} opacity-60`}
                  style={{
                    animation: `equalizer ${0.5 + Math.random() * 0.8}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 50}ms`,
                    height: '4px'
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Queue Panel */}
        {showQueue && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQueue(false)}>
            <div className="w-full max-w-lg max-h-[75vh] bg-slate-900/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Cola de reproducción</h3>
                  <p className="text-xs text-white/40">{queue.length} pistas pendientes</p>
                </div>
                <button onClick={() => setShowQueue(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-3 space-y-1">
                {queue.slice(0, 30).map((track, i) => (
                  <div
                    key={`${track.id}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                    onClick={() => {
                      playTrack(track);
                      setQueue(prev => prev.filter(t => t.id !== track.id));
                      setShowQueue(false);
                    }}
                  >
                    <span className="text-xs text-white/20 w-6 text-right font-mono group-hover:text-white/40">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-purple-900/30 border border-white/5">
                      {getTrackArtwork(track) ? (
                        <img src={getTrackArtwork(track)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm opacity-50">🎵</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-purple-200 transition-colors">{track.title}</p>
                      <p className="text-xs text-white/40">{formatDuration(track.duration)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${genreColors[classifyTrack(track)] || genreColors.general} hidden sm:inline-block`}>
                      {genreLabels[classifyTrack(track)] || 'General'}
                    </span>
                  </div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/30 text-sm">Regenerando cola de reproducción...</p>
                    <div className="mt-3 flex justify-center gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-4 bg-purple-400/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom info bar */}
        <footer className="mt-auto pt-4 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/30">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`}></div>
              <span className="font-medium">{isPlaying ? 'EN DIRECTO' : 'DETENIDO'}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://audius.co/profmanuelgago"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                audius.co/profmanuelgago
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span>🎧 {playedIds.size}</span>
              <span className="text-white/10">|</span>
              <span>📋 {queue.length}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom styles */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes equalizer {
          0% { height: 4px; }
          100% { height: 24px; }
        }
      `}</style>
    </div>
  );
}

export default App;
