/**
 * ============================================================================
 * APLICACIÓN PRINCIPAL: RADIO EL HOMBRE DE LAS NUBES
 * ============================================================================
 * FASES 4-6: Motor de reproducción continua 24/7 con TTS, timeout de
 * seguridad, manejo de errores y UI completa.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllArtistTracks,
  getArtistProfile,
  buildCatalog,
  AudiusTrack,
  AudiusUser,
  Album,
} from './lib/audius';
import {
  getCurrentBlock,
  getNextBlock,
  generateQueue,
  getWelcomeMessage,
  getBlockChangeMessage,
  ScheduleBlock,
} from './lib/scheduler';
import { initTTS, speak, speakStationID, stopSpeaking, isTTSAvailable } from './lib/tts';
import { initTTSSystem, unlockTTS, speakAd, stopTTS } from './lib/ttsService';
import { useRadioStore } from './store/useRadioStore';
import { logSystem, logTrack, logTTS, logError, logQueue } from './lib/logger';
import { saveCatalog, loadCatalog, saveRadioState, loadRadioState } from './lib/persistence';
import { adScheduler } from './lib/adScheduler';
import StationHeader from './components/StationHeader';
import NowPlaying from './components/NowPlaying';
import RadioPlayer from './components/RadioPlayer';
import ScheduleDisplay from './components/ScheduleDisplay';
import PlaylistQueue from './components/PlaylistQueue';

// ============================================================================
// TIMEOUT DE SEGURIDAD (FASE 4.3): 10 segundos
// ============================================================================
const STREAM_TIMEOUT_MS = 10000;

function App() {
  // Estado local
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Conectando con Audius...');
  const [isReady, setIsReady] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lastBlockName, setLastBlockName] = useState('');
  const [showAd, setShowAd] = useState(false);

  // Store
  const store = useRadioStore();
  const {
    currentTrack,
    currentTTSMessage,
    queue,
    status,
    isPlaying,
    isTTSPlaying,
    catalog,
    albums,
    isCatalogLoaded,
    currentBlock,
    playedIds,
    tracksPlayedCount,
    ttsPlayedCount,
    errorCount,
    error,
  } = store;

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsEnabledRef = useRef(ttsEnabled);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalogRef = useRef<AudiusTrack[]>([]);
  const albumsRef = useRef<Album[]>([]);
  const accumulatedMusicTimeRef = useRef(0);
  const lastAdTimeRef = useRef(0);

  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { catalogRef.current = catalog; }, [catalog]);
  useEffect(() => { albumsRef.current = albums; }, [albums]);

  // ========================================================================
  // SISTEMA DE PUBLICIDAD: Anuncios cada 10 segundos de música acumulada
  // ========================================================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // Solo contar tiempo si está reproduciendo música (no anuncios)
      if (store.isPlaying && !store.isTTSPlaying && !store.isPlayingAd) {
        accumulatedMusicTimeRef.current = audio.currentTime;
        
        // Verificar si han pasado 10 segundos desde el último anuncio
        const timeSinceLastAd = accumulatedMusicTimeRef.current - lastAdTimeRef.current;
        
        if (timeSinceLastAd >= 10) {
          console.log('[App] ⏰ 10 segundos de música acumulada - insertando anuncio');
          
          // Pausar la música
          audio.pause();
          
          // Obtener siguiente anunciante
          const advertiser = adScheduler.getNextAd();
          
          if (advertiser) {
            // Reproducir anuncio
            store.setCurrentAd(advertiser);
            store.setIsPlayingAd(true);
            
            speakAd(
              advertiser.adScript,
              () => {
                // Al terminar el anuncio
                console.log('[App] ✅ Anuncio de 10s terminado - reanudando música');
                store.setIsPlayingAd(false);
                store.setCurrentAd(null);
                
                // Resetear el contador
                lastAdTimeRef.current = audio.currentTime;
                
                // Reanudar la música
                audio.play().catch(err => {
                  logError('Error reanudando música después del anuncio', err);
                });
              },
              (error) => {
                // Si hay error, continuar con la música
                console.error('[App] ❌ Error en anuncio de 10s:', error);
                store.setIsPlayingAd(false);
                store.setCurrentAd(null);
                lastAdTimeRef.current = audio.currentTime;
                audio.play().catch(err => {
                  logError('Error reanudando música después del error de anuncio', err);
                });
              }
            );
          } else {
            // No hay anunciantes, continuar con la música
            lastAdTimeRef.current = audio.currentTime;
            audio.play().catch(err => {
              logError('Error reanudando música', err);
            });
          }
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [store.isPlaying, store.isTTSPlaying, store.isPlayingAd]);

  // ========================================================================
  // FASE 2: CARGA DEL CATÁLOGO
  // ========================================================================
  useEffect(() => {
    async function loadCatalogData() {
      try {
        // Intentar cargar desde caché primero
        setLoadingMessage('Verificando caché local...');
        setLoadingProgress(5);
        const cached = loadCatalog();

        if (cached && cached.tracks.length > 0 && cached.artist) {
          setLoadingMessage(`Catálogo en caché: ${cached.tracks.length} pistas`);
          setLoadingProgress(50);
          store.setCatalog(cached.tracks, cached.albums);
          catalogRef.current = cached.tracks;
          albumsRef.current = cached.albums;

          // Actualizar en background
          setLoadingMessage('Actualizando catálogo...');
          refreshCatalogInBackground(cached);
        } else {
          // Carga completa desde Audius
          setLoadingMessage('Obteniendo perfil del artista...');
          setLoadingProgress(10);
          const artist = await getArtistProfile();

          setLoadingMessage('Ingestando catálogo completo...');
          setLoadingProgress(20);
          const tracks = await fetchAllArtistTracks((loaded) => {
            setLoadingProgress(20 + Math.min(60, (loaded / 500) * 60));
          });

          setLoadingMessage('Clasificando y catalogando...');
          setLoadingProgress(85);
          const fullCatalog = buildCatalog(artist, tracks);

          // Guardar en caché
          saveCatalog(fullCatalog);
          store.setCatalog(fullCatalog.tracks, fullCatalog.albums);
          catalogRef.current = fullCatalog.tracks;
          albumsRef.current = fullCatalog.albums;
          setLoadingProgress(95);
        }

        // Inicializar TTS
        initTTS();
        initTTSSystem(); // Nuevo sistema TTS mejorado

        // Cargar estado previo
        const savedState = loadRadioState();
        if (savedState) {
          store.setVolume(savedState.volume);
          setTtsEnabled(savedState.ttsEnabled);
        }

        setLoadingProgress(100);
        setLoadingMessage('¡Emisora lista!');
        logSystem('Emisora inicializada correctamente');

        setTimeout(() => setIsReady(true), 600);
      } catch (err) {
        console.error('[App] Error loading catalog:', err);
        logError('Error al cargar catálogo', err);
        setLoadingMessage('Error al cargar. Recarga la página.');
      }
    }

    loadCatalogData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refrescar catálogo en background
  async function refreshCatalogInBackground(cached: any) {
    try {
      const artist = await getArtistProfile();
      const tracks = await fetchAllArtistTracks();
      if (tracks.length > cached.tracks.length) {
        const fullCatalog = buildCatalog(artist, tracks);
        saveCatalog(fullCatalog);
        store.setCatalog(fullCatalog.tracks, fullCatalog.albums);
        catalogRef.current = fullCatalog.tracks;
        albumsRef.current = fullCatalog.albums;
        logSystem(`Catálogo actualizado: ${cached.tracks.length} → ${tracks.length} pistas`);
      }
    } catch (e) {
      logError('Error actualizando catálogo en background', e);
    }
  }

  // ========================================================================
  // ACTUALIZAR BLOQUE DE PROGRAMACIÓN CADA MINUTO
  // ========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const block = getCurrentBlock();
      store.setCurrentBlock(block);

      // Detectar cambio de bloque
      if (block.name !== lastBlockName && lastBlockName !== '') {
        logSystem(`Cambio de bloque: → ${block.name}`);
        store.regenerateQueue();

        // TTS de cambio de bloque
        if (ttsEnabledRef.current && isTTSAvailable()) {
          const msg = getBlockChangeMessage(block.name);
          speak(msg, { rate: 0.85 });
        }
      }
      setLastBlockName(block.name);
    }, 60000);

    return () => clearInterval(interval);
  }, [lastBlockName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // FASE 4: MOTOR DE REPRODUCCIÓN - SIGUIENTE ITEM
  // ========================================================================
  const handleAdvance = useCallback(async () => {
    // Limpiar timeout de seguridad
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Marcar track como reproducida
    if (currentTrack) {
      store.markTrackPlayed(currentTrack.id);
    }
    if (isTTSPlaying) {
      store.incrementTTSCount();
    }

    // Avanzar al siguiente item
    const nextItem = store.advanceToNext();
    if (!nextItem) {
      logError('No se pudo obtener siguiente item');
      return;
    }

    // Procesar el siguiente item
    if (nextItem.type === 'tts') {
      // Siguiente es TTS
      store.setCurrentTTS(nextItem.message);
      if (ttsEnabledRef.current && isTTSAvailable()) {
        await speak(nextItem.message, {
          rate: 0.9,
          onEnd: () => {
            // Después del TTS, avanzar al siguiente (que será track)
            handleAdvance();
          },
        });
      } else {
        // TTS no disponible, saltar
        setTimeout(() => handleAdvance(), 500);
      }
    } else if (nextItem.type === 'ad') {
      // Siguiente es ANUNCIO PUBLICITARIO
      console.log('[App] 📢 Reproduciendo anuncio:', nextItem.advertiser.name);
      store.setCurrentAd(nextItem.advertiser);
      store.setIsPlayingAd(true);

      // Reproducir anuncio con TTS mejorado
      speakAd(
        nextItem.advertiser.adScript,
        () => {
          // onEnd
          console.log('[App] ✅ Anuncio terminado');
          store.setIsPlayingAd(false);
          store.setCurrentAd(null);
          // Avanzar al siguiente item
          handleAdvance();
        },
        (error) => {
          // onError
          console.error('[App] ❌ Error en anuncio:', error);
          store.setIsPlayingAd(false);
          store.setCurrentAd(null);
          handleAdvance();
        }
      );
    } else if (nextItem.type === 'track') {
      // Siguiente es track
      // Resetear el contador de tiempo acumulado para los anuncios cada 10s
      accumulatedMusicTimeRef.current = 0;
      lastAdTimeRef.current = 0;
      console.log('[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios');

      // TTS de transición antes de la pista
      if (ttsEnabledRef.current && isTTSAvailable() && tracksPlayedCount > 0 && tracksPlayedCount % 5 === 0) {
        store.setCurrentTTS('');
        await speakStationID();
      }

      store.setCurrentTrack(nextItem.track);

      // Reproducir audio
      const audio = audioRef.current;
      if (audio) {
        audio.src = store.streamUrl!;
        audio.volume = store.isMuted ? 0 : store.volume;
        try {
          await audio.play();
          store.setIsPlaying(true);
          startStreamTimeout();
        } catch (err) {
          logError('Error al reproducir audio', err);
          // Saltar a la siguiente
          setTimeout(() => handleAdvance(), 1000);
        }
      }
    }
  }, [currentTrack, isTTSPlaying, tracksPlayedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // FASE 4.3: TIMEOUT DE SEGURIDAD (10 segundos)
  // ========================================================================
  const startStreamTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && audio.readyState < 2) {
        // No ha cargado suficiente - saltar
        logError('Timeout de stream (10s). Saltando pista.');
        store.incrementErrorCount();
        audio.pause();
        handleAdvance();
      }
    }, STREAM_TIMEOUT_MS);
  }, [handleAdvance]);

  // Cancelar timeout cuando empieza a sonar
  useEffect(() => {
    if (isPlaying && audioRef.current && audioRef.current.readyState >= 2) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isPlaying]);

  // ========================================================================
  // INICIAR EMISORA (requiere interacción del usuario para autoplay)
  // ========================================================================
  const handleStartStation = useCallback(async () => {
    if (!isCatalogLoaded) return;

    logSystem('Usuario inició la emisora');

    // Desbloquear TTS con interacción del usuario
    await unlockTTS();

    // Generar cola inicial
    const block = getCurrentBlock();
    store.setCurrentBlock(block);
    setLastBlockName(block.name);

    const initialQueue = generateQueue(catalogRef.current, albumsRef.current, block);
    store.setQueue(initialQueue);

    // TTS de bienvenida
    if (ttsEnabledRef.current && isTTSAvailable()) {
      store.setCurrentTTS('');
      await speak(getWelcomeMessage(), { rate: 0.85 });
    }

    // Empezar con la primera pista
    handleAdvance();
  }, [isCatalogLoaded, handleAdvance]);

  // ========================================================================
  // PERSISTIR ESTADO
  // ========================================================================
  useEffect(() => {
    saveRadioState({
      volume: store.volume,
      ttsEnabled,
      lastTrackId: currentTrack?.id,
    });
  }, [store.volume, ttsEnabled, currentTrack]);

  // ========================================================================
  // LIMPIEZA
  // ========================================================================
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopSpeaking();
      stopTTS(); // Detener TTS de anuncios
    };
  }, []);

  // ========================================================================
  // PANTALLA DE CARGA
  // ========================================================================
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
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
          <h2 className="text-lg font-semibold text-purple-200 mb-2">Radio El Hombre de las Nubes</h2>
          <p className="text-sm text-purple-400/60 mb-6">{loadingMessage}</p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-white/20 mt-2 font-mono">{loadingProgress}%</p>
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

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Audio element oculto */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onEnded={() => handleAdvance()}
        onError={(e) => {
          logError('Error de audio', { error: e });
          store.incrementErrorCount();
          setTimeout(() => handleAdvance(), 1000);
        }}
        onPlaying={() => {
          // Cancelar timeout cuando empieza a sonar
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <StationHeader />

        <div className="px-4 md:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda */}
              <div className="lg:col-span-2 space-y-6">
                {/* Player Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                  <RadioPlayer
                    audioRef={audioRef}
                    onStartStation={handleStartStation}
                    onAdvance={handleAdvance}
                  />
                {/* Now Playing / TTS */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  {isTTSPlaying && currentTTSMessage ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <span className="text-lg">🔊</span>
                        <span className="text-sm text-purple-200 italic">{currentTTSMessage || 'Locución en curso...'}</span>
                      </div>
                    </div>
                  ) : (
                    <NowPlaying track={currentTrack} />
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Programación */}
              <ScheduleDisplay />
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* Cola */}
              <PlaylistQueue queue={queue} currentIndex={store.currentIndex} />

              {/* Configuración */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                  Configuración
                </h3>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔊</span>
                    <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Locuciones TTS</span>
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

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">Publicidad local</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={store.adsEnabled}
                      onChange={(e) => {
                        store.setAdsEnabled(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-amber-500/50 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white/60 rounded-full peer-checked:translate-x-4 peer-checked:bg-amber-300 transition-all"></div>
                  </div>
                </label>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Catálogo</span>
                    <span className="text-white/50 font-mono">{catalog.length} pistas</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Reproducidas</span>
                    <span className="text-white/50 font-mono">{tracksPlayedCount}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">TTS emitidas</span>
                    <span className="text-white/50 font-mono">{ttsPlayedCount}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">En cola</span>
                    <span className="text-white/50 font-mono">{queue.length - store.currentIndex}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Errores</span>
                    <span className={`font-mono ${errorCount > 0 ? 'text-red-400/70' : 'text-white/50'}`}>{errorCount}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Bloque actual</span>
                    <span className="text-white/50">{currentBlock.icon} {currentBlock.name}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Siguiente</span>
                    <span className="text-white/50">{getNextBlock().icon} {getNextBlock().name}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Anuncios</span>
                    <span className="text-white/50 font-mono">15 empresas</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30">Intervalo</span>
                    <span className="text-white/50 font-mono">30s</span>
                  </div>
                </div>
              </div>

              {/* Enlace Audius */}
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
                    <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">Perfil en Audius</p>
                    <p className="text-[10px] text-white/30">@profmanuelgago</p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>

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
