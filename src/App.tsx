/**
 * Radio El Hombre de las Nubes
 * Aplicación principal - Emisora autónoma 24/7
 * 
 * Integra: Audius API, Scheduler, TTS, Zustand Store
 * Reproduce automáticamente el catálogo del Prof. Manuel Gago Fernández
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllArtistTracks, getArtistProfile, AudiusTrack, AudiusUser } from './lib/audius';
import { getCurrentBlock, generateQueue, getNextBlock, ScheduleBlock } from './lib/scheduler';
import { initTTS, speakWelcome, speakTrackTransition, speakStationID, speakBlockTransition, stopSpeaking, isTTSAvailable } from './lib/tts';
import { useRadioStore } from './store/useRadioStore';
import StationHeader from './components/StationHeader';
import NowPlaying from './components/NowPlaying';
import RadioPlayer from './components/RadioPlayer';
import ScheduleDisplay from './components/ScheduleDisplay';
import PlaylistQueue from './components/PlaylistQueue';

function App() {
  // Estado local
  const [allTracks, setAllTracks] = useState<AudiusTrack[]>([]);
  const [artist, setArtist] = useState<AudiusUser | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Conectando con Audius...');
  const [isReady, setIsReady] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lastBlockName, setLastBlockName] = useState('');
  
  // Store
  const {
    currentTrack,
    queue,
    status,
    playedIds,
    initialize,
    setCurrentTrack,
    setStatus,
    playNext,
    addToHistory,
    play,
    pause,
    tracksPlayed,
  } = useRadioStore();

  // Ref para el catálogo completo (accesible en callbacks)
  const allTracksRef = useRef<AudiusTrack[]>([]);
  useEffect(() => { allTracksRef.current = allTracks; }, [allTracks]);

  // Cargar catálogo al montar
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingMessage('Obteniendo perfil del artista...');
        setLoadingProgress(10);
        
        const artistData = await getArtistProfile();
        setArtist(artistData);
        setLoadingProgress(20);

        setLoadingMessage('Cargando catálogo completo...');
        const tracks = await getAllArtistTracks();
        setAllTracks(tracks);
        allTracksRef.current = tracks;
        setLoadingProgress(90);

        // Inicializar store
        initialize(tracks);
        setLoadingProgress(100);
        setLoadingMessage('¡Listo para emitir!');
        
        // Inicializar TTS
        initTTS();
        
        setTimeout(() => setIsReady(true), 500);
      } catch (error) {
        console.error('[App] Error loading catalog:', error);
        setLoadingMessage('Error al cargar. Recarga la página.');
      }
    }

    loadCatalog();
  }, [initialize]);

  // Actualizar bloque de programación cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const block = getCurrentBlock();
      useRadioStore.setState({ currentBlock: block });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reconstruir cola cuando cambia el bloque
  useEffect(() => {
    const block = getCurrentBlock();
    if (block.name !== lastBlockName && lastBlockName !== '') {
      // Cambio de bloque - regenerar cola
      const newQueue = generateQueue(allTracksRef.current, block, playedIds);
      useRadioStore.setState({ queue: newQueue, currentBlock: block });
      
      // TTS de transición de bloque
      if (ttsEnabled && isTTSAvailable()) {
        speakBlockTransition(block.name, block.description);
      }
    }
    setLastBlockName(block.name);
  }, [status]);

  // Lógica de reproducción de la siguiente pista
  const handleTrackEnded = useCallback(async () => {
    // Añadir pista actual al historial
    if (currentTrack) {
      addToHistory(currentTrack);
    }

    // TTS de transición
    if (ttsEnabled && isTTSAvailable()) {
      setStatus('tts');
      
      // Cada 5 pistas, identificación de emisora
      if (tracksPlayed > 0 && tracksPlayed % 5 === 0) {
        await speakStationID();
      } else {
        // Obtener siguiente pista primero para mencionar su nombre
        const nextTrack = playNext();
        if (nextTrack) {
          await speakTrackTransition(nextTrack.title);
        }
      }
    }

    // Obtener siguiente pista si no se hizo en TTS
    let nextTrack = useRadioStore.getState().currentTrack;
    if (!nextTrack || nextTrack?.id === currentTrack?.id) {
      nextTrack = playNext();
    }

    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setStatus('playing');
    } else {
      // Cola vacía - reconstruir
      const block = getCurrentBlock();
      const newQueue = generateQueue(allTracksRef.current, block, new Set());
      useRadioStore.setState({ queue: newQueue });
      
      if (newQueue.length > 0) {
        const first = newQueue[0];
        useRadioStore.setState({ queue: newQueue.slice(1) });
        setCurrentTrack(first);
        setStatus('playing');
      }
    }
  }, [currentTrack, ttsEnabled, tracksPlayed, addToHistory, playNext, setCurrentTrack, setStatus]);

  // Iniciar la emisora (requiere interacción del usuario para autoplay)
  const handleStartStation = useCallback(async () => {
    if (allTracks.length === 0) return;

    // Bienvenida TTS
    if (ttsEnabled && isTTSAvailable()) {
      setStatus('tts');
      await speakWelcome();
    }

    // Obtener primera pista de la cola
    const block = getCurrentBlock();
    const firstQueue = generateQueue(allTracks, block);
    
    if (firstQueue.length > 0) {
      const firstTrack = firstQueue[0];
      useRadioStore.setState({ 
        queue: firstQueue.slice(1),
        currentBlock: block,
      });
      setCurrentTrack(firstTrack);
      setStatus('playing');
    }
  }, [allTracks, ttsEnabled, setCurrentTrack, setStatus]);

  // Selección de pista desde la cola
  const handleTrackSelect = useCallback((track: AudiusTrack) => {
    // Remover de la cola y reproducir
    const newQueue = queue.filter(t => t.id !== track.id);
    useRadioStore.setState({ queue: newQueue });
    setCurrentTrack(track);
    setStatus('playing');
  }, [queue, setCurrentTrack, setStatus]);

  // Pantalla de carga
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          {/* Logo animado */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping"></div>
            <div className="absolute inset-3 rounded-full border-2 border-purple-400/30 animate-pulse"></div>
            <div className="absolute inset-6 rounded-full border-2 border-indigo-400/20 animate-pulse" style={{ animationDelay: '500ms' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-2xl">☁️</span>
              </div>
            </div>
          </div>

          {/* Texto de carga */}
          <h2 className="text-lg font-semibold text-purple-200 mb-2">
            Radio El Hombre de las Nubes
          </h2>
          <p className="text-sm text-purple-400/60 mb-6">{loadingMessage}</p>

          {/* Barra de progreso */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-white/20 mt-2 font-mono">{loadingProgress}%</p>

          {/* Ecualizador de carga */}
          <div className="mt-6 flex justify-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-purple-400/40 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <StationHeader />

        {/* Layout principal */}
        <div className="px-4 md:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Reproductor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Player Card */}
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <RadioPlayer
                  onTrackEnded={handleTrackEnded}
                  onStartStation={handleStartStation}
                />
                
                {/* Now Playing */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <NowPlaying track={currentTrack} />
                </div>
              </div>

              {/* Programación */}
              <ScheduleDisplay />
            </div>

            {/* Columna derecha: Cola y controles */}
            <div className="space-y-6">
              {/* Cola */}
              <PlaylistQueue queue={queue} onTrackSelect={handleTrackSelect} />

              {/* Controles adicionales */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                  Configuración
                </h3>

                {/* Toggle TTS */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔊</span>
                    <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                      Locuciones TTS
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={ttsEnabled}
                      onChange={(e) => setTtsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-purple-500/50 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white/60 rounded-full peer-checked:translate-x-4 peer-checked:bg-purple-300 transition-all"></div>
                  </div>
                </label>

                {/* Info de la emisora */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Catálogo</span>
                    <span className="text-white/50 font-mono">{allTracks.length} pistas</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Reproducidas</span>
                    <span className="text-white/50 font-mono">{tracksPlayed}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">En cola</span>
                    <span className="text-white/50 font-mono">{queue.length}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Bloque actual</span>
                    <span className="text-white/50">{getCurrentBlock().icon} {getCurrentBlock().name}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Siguiente bloque</span>
                    <span className="text-white/50">{getNextBlock().icon} {getNextBlock().name}</span>
                  </div>
                </div>
              </div>

              {/* Enlace a Audius */}
              <a
                href="https://audius.co/profmanuelgago"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/[0.02] rounded-2xl border border-white/5 p-4 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5">
                    <span className="text-lg">🎵</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">
                      Perfil en Audius
                    </p>
                    <p className="text-[10px] text-white/30">
                      @profmanuelgago
                      {artist && ` • ${artist.follower_count} seguidores`}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 md:px-8 pb-6">
          <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/20">
            <span>Radio El Hombre de las Nubes © 2025</span>
            <span>Emisora autónoma 24/7 • Powered by Audius</span>
            <span>Prof. Manuel Gago Fernández</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
