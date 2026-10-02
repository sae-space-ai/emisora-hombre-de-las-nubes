/**
 * Componente RadioPlayer
 * Reproductor principal con controles de play/pause, skip, volumen
 * Maneja el elemento <audio> y la lógica de autoplay
 */

import { useRef, useEffect, useCallback } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { speakTrackTransition, speakStationID } from '../lib/tts';
import Visualizer from './Visualizer';

interface RadioPlayerProps {
  onTrackEnded: () => void;
  onStartStation: () => void;
}

export default function RadioPlayer({ onTrackEnded, onStartStation }: RadioPlayerProps) {
  const {
    currentTrack,
    streamUrl,
    status,
    volume,
    isMuted,
    setStatus,
    setProgress,
    setDuration,
    play,
    pause,
    isInitialized,
  } = useRadioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Configurar audio cuando cambia la URL del stream
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    audio.src = streamUrl;
    audio.volume = isMuted ? 0 : volume;

    if (status === 'playing') {
      audio.play().catch(err => {
        console.error('[Player] Error al reproducir:', err);
      });
    }
  }, [streamUrl]);

  // Controlar volumen
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Tracking de progreso
  useEffect(() => {
    if (status === 'playing') {
      progressInterval.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio) {
          setProgress(audio.currentTime);
          setDuration(audio.duration || 0);
        }
      }, 250);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [status, setProgress, setDuration]);

  // Manejar fin de pista
  const handleEnded = useCallback(() => {
    onTrackEnded();
  }, [onTrackEnded]);

  // Manejar errores de audio
  const handleError = useCallback(() => {
    console.warn('[Player] Error de audio, saltando a la siguiente pista...');
    // Intentar reproducir siguiente después de un breve delay
    setTimeout(() => {
      onTrackEnded();
    }, 1000);
  }, [onTrackEnded]);

  // Toggle play/pause
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (status === 'playing') {
      audio.pause();
      pause();
    } else {
      try {
        await audio.play();
        play();
      } catch (err) {
        console.error('[Player] Error al reproducir:', err);
      }
    }
  };

  // Skip a siguiente
  const handleSkip = () => {
    onTrackEnded();
  };

  // Control de volumen
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    useRadioStore.getState().setVolume(newVolume);
  };

  // Si la radio no está iniciada, mostrar botón de inicio
  if (!isInitialized || (!currentTrack && status === 'idle')) {
    return (
      <div className="text-center py-8">
        <Visualizer />
        <button
          onClick={onStartStation}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 font-bold text-lg transform hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Iniciar Emisora
          </span>
        </button>
        <p className="text-xs text-white/30 mt-3">
          Pulsa para activar el audio y comenzar la reproducción
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visualizer */}
      <Visualizer />

      {/* Controles principales */}
      <div className="flex items-center justify-center gap-4">
        {/* Botón anterior (reinicia pista actual) */}
        <button
          onClick={() => {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
            }
          }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
          title="Reiniciar pista"
        >
          <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className="p-5 md:p-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 transform hover:scale-105 active:scale-95"
          title={status === 'playing' ? 'Pausar' : 'Reproducir'}
        >
          {status === 'playing' ? (
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Skip siguiente */}
        <button
          onClick={handleSkip}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
          title="Siguiente pista"
        >
          <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>

      {/* Control de volumen */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => useRadioStore.getState().toggleMute()}
          className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          {isMuted || volume === 0 ? (
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volume < 0.5 ? (
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border-0"
        />
        
        <span className="text-[10px] text-white/30 w-8 text-right font-mono">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      {/* Elemento audio oculto */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onEnded={handleEnded}
        onError={handleError}
      />
    </div>
  );
}
