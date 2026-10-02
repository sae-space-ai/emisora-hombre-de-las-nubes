/**
 * RadioPlayer - Reproductor principal con anuncios integrados en la cola
 * Los anuncios se reproducen como parte natural de la secuencia de QueueItems
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { logSystem, logError } from '../lib/logger';
import Visualizer from './Visualizer';

interface RadioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  onStartStation: () => void;
  onAdvance: () => void;
}

export default function RadioPlayer({ audioRef, onStartStation, onAdvance }: RadioPlayerProps) {
  const {
    isCatalogLoaded,
    currentTrack,
    isPlaying,
    isTTSPlaying,
    status,
    volume,
    isMuted,
    setIsPlaying,
    setVolume,
    toggleMute,
    currentAd,
    isPlayingAd,
    adsEnabled,
    setCurrentAd,
    setIsPlayingAd,
  } = useRadioStore();

  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========================================================================
  // REPRODUCIR ANUNCIO (como parte de la cola)
  // ========================================================================
  const playAd = useCallback(async (advertiser: any): Promise<void> => {
    if (!adsEnabled) {
      console.log('[RadioPlayer] ⚠️ Anuncios deshabilitados, saltando');
      return;
    }

    console.log('[RadioPlayer] 📢 Reproduciendo anuncio:', advertiser.name);

    // 1. Pausar música si está sonando
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.pause();
      console.log('[RadioPlayer] ⏸️ Música pausada para anuncio');
    }

    // 2. Actualizar estado
    setCurrentAd(advertiser);
    setIsPlayingAd(true);

    // 3. Cancelar cualquier TTS previo
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error('[RadioPlayer] ❌ TTS no disponible');
        setIsPlayingAd(false);
        setCurrentAd(null);
        resolve();
        return;
      }

      // 4. Crear utterance
      const utterance = new SpeechSynthesisUtterance(advertiser.adScript);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 5. Configurar voz española
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang === 'es-ES');
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      console.log('[RadioPlayer] 🎙️ TTS iniciado');

      // 6. Temporizador de seguridad (30 segundos)
      ttsTimeoutRef.current = setTimeout(() => {
        console.warn('[RadioPlayer] ⚠️ TTS timeout (30s), forzando finalización');
        cleanup();
        resolve();
      }, 30000);

      // 7. Callbacks
      utterance.onstart = () => {
        console.log('[RadioPlayer] ✅ TTS onstart');
      };

      utterance.onend = () => {
        console.log('[RadioPlayer] ✅ TTS terminado');
        cleanup();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[RadioPlayer] ❌ Error en TTS:', event.error);
        cleanup();
        resolve();
      };

      // 8. Reproducir TTS
      window.speechSynthesis.speak(utterance);

      // Función de limpieza
      const cleanup = () => {
        if (ttsTimeoutRef.current) {
          clearTimeout(ttsTimeoutRef.current);
          ttsTimeoutRef.current = null;
        }

        setIsPlayingAd(false);
        setCurrentAd(null);

        // Reanudar música si estaba sonando antes del anuncio
        if (audio && status === 'playing') {
          audio.play().then(() => {
            console.log('[RadioPlayer] ▶️ Música reanudada después del anuncio');
            setIsPlaying(true);
          }).catch(err => {
            console.error('[RadioPlayer] ❌ Error reanudando música:', err);
          });
        }
      };
    });
  }, [adsEnabled, audioRef, isPlaying, status, setCurrentAd, setIsPlayingAd, setIsPlaying]);

  // ========================================================================
  // CONTROL DE VOLUMEN
  // ========================================================================
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !isPlayingAd) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isPlayingAd, audioRef]);

  // ========================================================================
  // PLAY/PAUSE
  // ========================================================================
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || isPlayingAd) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[RadioPlayer] ❌ Error al reproducir:', err);
      }
    }
  };

  // ========================================================================
  // RENDER: PANTALLA DE INICIO
  // ========================================================================
  if (!isCatalogLoaded || (!currentTrack && status === 'idle')) {
    return (
      <div className="text-center py-8">
        <Visualizer />
        <button
          onClick={onStartStation}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 font-bold text-lg transform hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Iniciar Emisora
          </span>
        </button>
        <p className="text-xs text-white/30 mt-3">
          Pulsa para activar el audio y comenzar la reproducción autónoma
        </p>
      </div>
    );
  }

  // ========================================================================
  // RENDER: REPRODUCTOR CON CONTROLES
  // ========================================================================
  return (
    <div className="space-y-4">
      <Visualizer />

      {/* Banner de publicidad */}
      {isPlayingAd && currentAd && (
        <div className="bg-red-600 text-white p-3 rounded-lg animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold opacity-90">PUBLICIDAD</p>
              <p className="text-sm font-semibold">{currentAd.name}</p>
              <p className="text-xs opacity-80">{currentAd.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controles principales */}
      <div className="flex items-center justify-center gap-4">
        {/* Reiniciar */}
        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
          title="Reiniciar pista"
        >
          <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!currentTrack || isPlayingAd}
          className="p-5 md:p-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip */}
        <button
          onClick={onAdvance}
          disabled={isPlayingAd}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group disabled:opacity-50"
          title="Siguiente"
        >
          <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Control de volumen */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={toggleMute} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
          {isMuted || volume === 0 ? (
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-[10px] text-white/30 w-8 text-right font-mono">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
  );
}
