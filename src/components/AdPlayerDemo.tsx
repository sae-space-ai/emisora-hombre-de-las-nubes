/**
 * Página de Demostración del Sistema de Publicidad
 * Permite probar el sistema sin archivos de audio reales
 */

import { useState, useRef, useEffect } from 'react';
import { adPlayer } from '../lib/adPlayer';
import { generateAllTestAds } from '../lib/audioGenerator';

export default function AdPlayerDemo() {
  const [state, setState] = useState<string>('idle');
  const [currentAd, setCurrentAd] = useState<string>('');
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  // Inicializar el reproductor
  useEffect(() => {
    if (!audioRef.current) return;

    // Función para obtener URL de música (usando pistas de ejemplo)
    const getMusicUrl = (trackId: string) => {
      // URLs de ejemplo de audio libre
      const sampleTracks: Record<string, string> = {
        'track_1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'track_2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'track_3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      };
      return sampleTracks[trackId] || sampleTracks['track_1'];
    };

    adPlayer.initialize(
      audioRef.current,
      getMusicUrl,
      {
        onAdStart: (ad) => {
          setCurrentAd(ad.name);
          addLog(`📢 Anuncio iniciado: ${ad.name}`);
        },
        onAdEnd: (ad) => {
          setCurrentAd('');
          addLog(`✅ Anuncio terminado: ${ad.name}`);
        },
        onMusicStart: () => {
          addLog('🎵 Música iniciada');
        },
        onMusicEnd: () => {
          addLog('🎵 Música terminada');
        },
        onStateChange: (newState) => {
          setState(newState);
          addLog(`🔄 Estado: ${newState}`);
        },
        onAccumulatedTimeUpdate: (seconds) => {
          setAccumulatedTime(seconds);
          addLog(`⏱️ Tiempo acumulado: ${seconds.toFixed(1)}s`);
        },
      }
    );

    // Cargar cola de música de ejemplo
    adPlayer.loadMusicQueue(['track_1', 'track_2', 'track_3']);
    addLog('📋 Cola de música cargada: 3 pistas de ejemplo');

    return () => {
      adPlayer.destroy();
    };
  }, []);

  // Handlers
  const handlePlay = async () => {
    addLog('▶️ Play pulsado');
    await adPlayer.play();
  };

  const handlePause = () => {
    addLog('⏸️ Pausar pulsado');
    adPlayer.pause();
  };

  const handleResume = () => {
    addLog('▶️ Reanudar pulsado');
    adPlayer.resume();
  };

  const handleStop = () => {
    addLog('⏹️ Stop pulsado');
    adPlayer.stop();
  };

  const handleGenerateTestAds = async () => {
    addLog('🎵 Generando archivos de audio de prueba...');
    await generateAllTestAds();
    addLog('✅ Archivos generados. Descárgalos y muévelos a public/audio/ads/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            📢 Sistema de Publicidad - Demo
          </h1>
          <p className="text-white/60">
            Prueba el sistema de publicidad simple e independiente
          </p>
        </div>

        {/* Elemento de audio oculto */}
        <audio ref={audioRef} className="hidden" />

        {/* Estado actual */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Estado:</p>
              <p className={`text-lg font-medium ${
                state === 'playing_ad' ? 'text-amber-400' :
                state === 'playing_music' ? 'text-green-400' :
                state === 'paused' ? 'text-blue-400' :
                'text-white/50'
              }`}>
                {state === 'idle' && '⚪ Inactivo'}
                {state === 'playing_ad' && '📢 Reproduciendo Anuncio'}
                {state === 'playing_music' && '🎵 Reproduciendo Música'}
                {state === 'paused' && '⏸️ Pausado'}
                {state === 'stopped' && '⏹️ Detenido'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-white/50 mb-1">Anuncio actual:</p>
              <p className="text-lg font-medium text-amber-300">
                {currentAd || 'Ninguno'}
              </p>
            </div>
          </div>

          {/* Tiempo acumulado */}
          {state === 'playing_music' && (
            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <p className="text-xs text-white/50 mb-2">Tiempo de música acumulado:</p>
              <p className="text-2xl font-bold text-purple-300 mb-2">
                {accumulatedTime.toFixed(1)}s
              </p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (accumulatedTime / 10) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Próximo anuncio en: {Math.max(0, 10 - accumulatedTime).toFixed(1)}s
              </p>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controles</h2>
          
          <div className="flex flex-wrap gap-3">
            {/* Play */}
            {(state === 'idle' || state === 'stopped') && (
              <button
                onClick={handlePlay}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg font-medium"
              >
                ▶️ Play
              </button>
            )}

            {/* Pause */}
            {state === 'playing_music' && (
              <button
                onClick={handlePause}
                className="px-6 py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all font-medium text-blue-300"
              >
                ⏸️ Pausar
              </button>
            )}

            {/* Resume */}
            {state === 'paused' && (
              <button
                onClick={handleResume}
                className="px-6 py-3 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all font-medium text-green-300"
              >
                ▶️ Reanudar
              </button>
            )}

            {/* Stop */}
            {(state === 'playing_music' || state === 'playing_ad' || state === 'paused') && (
              <button
                onClick={handleStop}
                className="px-6 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all font-medium text-red-300"
              >
                ⏹️ Stop
              </button>
            )}

            {/* Generar archivos de prueba */}
            <button
              onClick={handleGenerateTestAds}
              className="px-6 py-3 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all font-medium text-amber-300"
            >
              🎵 Generar Archivos de Prueba
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Registro de Actividad</h2>
          
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-white/30">No hay actividad aún. Pulsa Play para comenzar.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-white/60 py-1 border-b border-white/5">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">📋 Instrucciones de Prueba</h2>
          
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">1.</span>
              <p>Pulsa <strong>"Generar Archivos de Prueba"</strong> para crear archivos de audio de ejemplo</p>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">2.</span>
              <p>Descarga los archivos generados y muévelos a <code className="bg-white/10 px-2 py-0.5 rounded">public/audio/ads/</code></p>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">3.</span>
              <p>Pulsa <strong>Play</strong> y observa cómo se reproduce el anuncio de bienvenida</p>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">4.</span>
              <p>Espera 10 segundos y verifica que se inserta un anuncio entre canciones</p>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">5.</span>
              <p>Prueba <strong>Pausar</strong> y <strong>Reanudar</strong> para verificar que el tiempo se mantiene</p>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold">6.</span>
              <p>Prueba <strong>Stop</strong> para verificar que NO se reproduce anuncio de cierre</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">
              💡 <strong>Nota:</strong> Esta demo usa pistas de audio de ejemplo de SoundHelix. 
              En tu aplicación real, usarás las pistas de Audius del Prof. Manuel Gago Fernández.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
