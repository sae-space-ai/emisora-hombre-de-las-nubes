/**
 * Componente de Publicidad Simple
 * Integra el sistema de publicidad con el reproductor
 */

import { useEffect, useRef, useState } from 'react';
import { adPlayer, AdInfo, PlaybackState } from '../lib/adPlayer';

interface AdPlayerComponentProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  musicQueue: string[];
  getMusicUrl: (trackId: string) => string;
}

export default function AdPlayerComponent({ audioRef, musicQueue, getMusicUrl }: AdPlayerComponentProps) {
  const [state, setState] = useState<PlaybackState>('idle');
  const [currentAd, setCurrentAd] = useState<AdInfo | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);

  // Inicializar el reproductor de publicidad
  useEffect(() => {
    if (!audioRef.current) return;

    adPlayer.initialize(
      audioRef.current,
      getMusicUrl,
      {
        onAdStart: (ad) => {
          console.log('[AdPlayerComponent] 📢 Anuncio iniciado:', ad.name);
          setCurrentAd(ad);
        },
        onAdEnd: (ad) => {
          console.log('[AdPlayerComponent] ✅ Anuncio terminado:', ad.name);
          setCurrentAd(null);
        },
        onMusicStart: () => {
          console.log('[AdPlayerComponent] 🎵 Música iniciada');
        },
        onMusicEnd: () => {
          console.log('[AdPlayerComponent] 🎵 Música terminada');
        },
        onStateChange: (newState) => {
          setState(newState);
        },
        onAccumulatedTimeUpdate: (seconds) => {
          setAccumulatedTime(seconds);
        },
      }
    );

    // Cargar cola de música
    adPlayer.loadMusicQueue(musicQueue);

    return () => {
      adPlayer.destroy();
    };
  }, [audioRef, musicQueue, getMusicUrl]);

  // Handlers
  const handlePlay = async () => {
    await adPlayer.play();
  };

  const handlePause = () => {
    adPlayer.pause();
  };

  const handleResume = () => {
    adPlayer.resume();
  };

  const handleStop = () => {
    adPlayer.stop();
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>📢</span>
        Sistema de Publicidad
      </h3>

      {/* Estado actual */}
      <div className="mb-4 p-3 rounded-lg bg-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">Estado:</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            state === 'playing_ad' ? 'bg-amber-500/20 text-amber-300' :
            state === 'playing_music' ? 'bg-green-500/20 text-green-300' :
            state === 'paused' ? 'bg-blue-500/20 text-blue-300' :
            'bg-white/10 text-white/50'
          }`}>
            {state === 'idle' && 'Inactivo'}
            {state === 'playing_ad' && 'Reproduciendo Anuncio'}
            {state === 'playing_music' && 'Reproduciendo Música'}
            {state === 'paused' && 'Pausado'}
            {state === 'stopped' && 'Detenido'}
          </span>
        </div>

        {/* Anuncio actual */}
        {currentAd && (
          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300 font-medium">📢 {currentAd.name}</p>
            <p className="text-[10px] text-amber-400/60">Duración: {currentAd.duration}s</p>
          </div>
        )}

        {/* Tiempo acumulado */}
        {state === 'playing_music' && (
          <div className="mt-2">
            <p className="text-[10px] text-white/40">
              Tiempo de música acumulado: {accumulatedTime.toFixed(1)}s
            </p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (accumulatedTime / 10) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-white/30 mt-1">
              Próximo anuncio en: {Math.max(0, 10 - accumulatedTime).toFixed(1)}s
            </p>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-3">
        {/* Play */}
        {(state === 'idle' || state === 'stopped') && (
          <button
            onClick={handlePlay}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg font-medium text-sm"
          >
            ▶️ Play
          </button>
        )}

        {/* Pause */}
        {state === 'playing_music' && (
          <button
            onClick={handlePause}
            className="px-6 py-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all font-medium text-sm text-blue-300"
          >
            ⏸️ Pausar
          </button>
        )}

        {/* Resume */}
        {state === 'paused' && (
          <button
            onClick={handleResume}
            className="px-6 py-2 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all font-medium text-sm text-green-300"
          >
            ▶️ Reanudar
          </button>
        )}

        {/* Stop */}
        {(state === 'playing_music' || state === 'playing_ad' || state === 'paused') && (
          <button
            onClick={handleStop}
            className="px-6 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all font-medium text-sm text-red-300"
          >
            ⏹️ Stop
          </button>
        )}
      </div>

      {/* Información */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[10px] text-white/30 text-center">
          💡 Los anuncios se insertan automáticamente cada 10 segundos de música, esperando al final de cada canción
        </p>
      </div>
    </div>
  );
}
