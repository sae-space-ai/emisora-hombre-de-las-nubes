/**
 * FASE CORRECTIVA: RadioPlayer con sistema de publicidad robusto
 * 
 * CORRECCIONES APLICADAS:
 * 1. Desbloqueo de AudioContext y TTS en el primer clic del usuario
 * 2. Lógica de temporización basada en timestamps (no módulo)
 * 3. Estrategia de "pausa y reanuda" en lugar de ducking complejo
 * 4. Indicador visual claro del estado de publicidad
 * 5. Logs de depuración en puntos clave
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { adScheduler, Advertiser } from '../lib/adScheduler';
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
    nextAdTime,
    isAudioUnlocked,
    setCurrentAd,
    setIsPlayingAd,
    setNextAdTime,
    incrementAdPlayCount,
    setAudioUnlocked,
  } = useRadioStore();

  const adInProgress = useRef(false);
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========================================================================
  // FASE 1: DESBLOQUEO DE AUDIO Y TTS (CRÍTICO)
  // ========================================================================
  const unlockAudioAndTTS = useCallback(async () => {
    if (isAudioUnlocked) {
      console.log('[RadioPlayer] Audio ya desbloqueado');
      return;
    }

    console.log('[RadioPlayer] 🔓 Desbloqueando AudioContext y TTS...');

    try {
      // 1. Desbloquear AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[RadioPlayer] ✅ AudioContext desbloqueado');
      }
      audioContext.close();

      // 2. Calentar motor de TTS con frase vacía
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
        console.log('[RadioPlayer] ✅ TTS calentado');
      }

      // 3. Guardar estado
      setAudioUnlocked(true);
      console.log('[RadioPlayer] ✅ Audio y TTS desbloqueados correctamente');
    } catch (error) {
      console.error('[RadioPlayer] ❌ Error desbloqueando audio:', error);
    }
  }, [isAudioUnlocked, setAudioUnlocked]);

  // ========================================================================
  // FASE 3: REPRODUCCIÓN ROBUSTA DEL TTS (PAUSA Y REANUDA)
  // ========================================================================
  const playAd = useCallback(async (advertiser: Advertiser): Promise<void> => {
    if (!adsEnabled || adInProgress.current) {
      console.log('[RadioPlayer] ⚠️ Anuncio bloqueado (adsEnabled:', adsEnabled, ', inProgress:', adInProgress.current, ')');
      return;
    }

    console.log('[RadioPlayer] 📢 Anuncio disparado:', advertiser.name);
    adInProgress.current = true;

    // 1. Pausar música
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      console.log('[RadioPlayer] ⏸️ Música pausada');
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
        adInProgress.current = false;
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
        console.log('[RadioPlayer] ✅ TTS terminado, reanudando música');
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
        adInProgress.current = false;

        // Reanudar música
        if (audio && status === 'playing') {
          audio.play().then(() => {
            console.log('[RadioPlayer] ▶️ Música reanudada');
            setIsPlaying(true);
          }).catch(err => {
            console.error('[RadioPlayer] ❌ Error reanudando música:', err);
          });
        }
      };
    });
  }, [adsEnabled, audioRef, status, setCurrentAd, setIsPlayingAd, setIsPlaying]);

  // ========================================================================
  // FASE 2: TEMPORIZACIÓN CORREGIDA (EVENTO timeupdate)
  // ========================================================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !adsEnabled || !isAudioUnlocked) return;

    const handleTimeUpdate = async () => {
      // No disparar anuncios si ya hay uno en curso
      if (isPlayingAd || isTTSPlaying || adInProgress.current) return;

      const currentTime = audio.currentTime;
      
      // Usar la función corregida del scheduler
      if (adScheduler.shouldPlayAdDuringTrack(currentTime, nextAdTime)) {
        console.log('[RadioPlayer] ⏰ Disparando anuncio programado en', currentTime, 's');
        
        const advertiser = adScheduler.getNextAd();
        if (advertiser) {
          await playAd(advertiser);
          
          // Actualizar nextAdTime DESPUÉS de que termine el anuncio
          const newNextAdTime = audio.currentTime + 15;
          setNextAdTime(newNextAdTime);
          incrementAdPlayCount();
          console.log('[RadioPlayer] 📅 Próximo anuncio en', newNextAdTime, 's');
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioRef, adsEnabled, isAudioUnlocked, isPlayingAd, isTTSPlaying, nextAdTime, playAd, setNextAdTime, incrementAdPlayCount]);

  // ========================================================================
  // FASE 4: ANUNCIO AL INICIO DE CADA PISTA
  // ========================================================================
  useEffect(() => {
    if (!currentTrack || !adsEnabled || !isAudioUnlocked) return;
    if (!adScheduler.shouldPlayAdAtStart()) return;

    const playStartAd = async () => {
      console.log('[RadioPlayer] 🎬 Reproduciendo anuncio al inicio de pista');
      
      const advertiser = adScheduler.getNextAd();
      if (advertiser) {
        await playAd(advertiser);
        
        // Programar primer anuncio durante la pista
        const audio = audioRef.current;
        if (audio) {
          setNextAdTime(audio.currentTime + 15);
          console.log('[RadioPlayer] 📅 Primer anuncio durante pista en 15s');
        }
      }
    };

    // Pequeño delay para asegurar que el audio está listo
    const timer = setTimeout(playStartAd, 300);

    return () => clearTimeout(timer);
  }, [currentTrack, adsEnabled, isAudioUnlocked, playAd, setNextAdTime, audioRef]);

  // ========================================================================
  // FASE 4: ANUNCIO AL FINAL DE CADA PISTA
  // ========================================================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !adsEnabled || !isAudioUnlocked) return;

    const handleEnded = async (e: Event) => {
      if (!adScheduler.shouldPlayAdAtEnd()) {
        console.log('[RadioPlayer] ⏭️ Sin anuncio al final, avanzando');
        onAdvance();
        return;
      }

      if (adInProgress.current) return;

      console.log('[RadioPlayer] 🏁 Reproduciendo anuncio al final de pista');
      
      const advertiser = adScheduler.getNextAd();
      if (advertiser) {
        await playAd(advertiser);
      }

      // Avanzar a la siguiente pista
      onAdvance();
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, adsEnabled, isAudioUnlocked, onAdvance, playAd]);

  // ========================================================================
  // RESET PARA NUEVA PISTA
  // ========================================================================
  useEffect(() => {
    if (currentTrack) {
      adScheduler.resetForNewTrack();
      console.log('[RadioPlayer] 🔄 Reset para nueva pista');
    }
  }, [currentTrack]);

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
  // HANDLER PARA BOTÓN INICIAR EMISORA
  // ========================================================================
  const handleStartStation = async () => {
    // FASE 1: Desbloquear audio y TTS ANTES de iniciar
    await unlockAudioAndTTS();
    
    // Luego iniciar la emisora
    onStartStation();
  };

  // ========================================================================
  // RENDER: PANTALLA DE INICIO
  // ========================================================================
  if (!isCatalogLoaded || (!currentTrack && status === 'idle')) {
    return (
      <div className="text-center py-8">
        <Visualizer />
        <button
          onClick={handleStartStation}
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
        {!isAudioUnlocked && (
          <p className="text-xs text-amber-400/60 mt-2">
            🔓 Este botón desbloqueará el audio y los anuncios
          </p>
        )}
      </div>
    );
  }

  // ========================================================================
  // RENDER: REPRODUCTOR CON CONTROLES
  // ========================================================================
  return (
    <div className="space-y-4">
      <Visualizer />

      {/* FASE 5: INDICADOR VISUAL DE PUBLICIDAD */}
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

      {/* Información de depuración */}
      {import.meta.env.DEV && (
        <div className="text-[10px] text-white/20 text-center space-y-1">
          <p>Audio desbloqueado: {isAudioUnlocked ? '✅' : '❌'}</p>
          <p>Próximo anuncio en: {nextAdTime > 0 ? `${nextAdTime.toFixed(1)}s` : 'No programado'}</p>
          <p>Anuncios reproducidos: {useRadioStore.getState().adPlayCount}</p>
        </div>
      )}
    </div>
  );
}
