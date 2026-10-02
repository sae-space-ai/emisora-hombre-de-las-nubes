/**
 * Componente NowPlaying
 * Muestra la pista actual con carátula, metadatos y barra de progreso
 */

import { AudiusTrack, getTrackArtwork, formatDuration, classifyTrack, CATEGORY_LABELS, CATEGORY_BADGE } from '../lib/audius';
import { useRadioStore } from '../store/useRadioStore';

interface NowPlayingProps {
  track: AudiusTrack | null;
}

export default function NowPlaying({ track }: NowPlayingProps) {
  const { progress, duration, status } = useRadioStore();
  
  if (!track) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <span className="text-4xl opacity-30">🎵</span>
        </div>
        <p className="text-white/30 text-sm">Selecciona una pista para comenzar</p>
      </div>
    );
  }

  const category = classifyTrack(track);
  const artwork = getTrackArtwork(track);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Carátula y info */}
      <div className="flex items-center gap-4">
        {/* Carátula */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-lg">
            {artwork ? (
              <img 
                src={artwork} 
                alt={track.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            )}
          </div>
          {/* Indicador de reproducción */}
          {status === 'playing' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-slate-900">
              <div className="flex items-end gap-[1px] h-2.5">
                <div className="w-[2px] bg-white rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }}></div>
                <div className="w-[2px] bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }}></div>
                <div className="w-[2px] bg-white rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm md:text-base truncate leading-tight">
            {track.title}
          </h3>
          <p className="text-xs md:text-sm text-purple-300/70 truncate mt-0.5">
            Prof. Manuel Gago Fernández
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${CATEGORY_BADGE[category]}`}>
              {CATEGORY_LABELS[category]}
            </span>
            {track.bpm && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/40 border border-white/10">
                {track.bpm} BPM
              </span>
            )}
            <span className="text-[10px] text-white/30 font-mono">
              {formatDuration(track.duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-white/30 font-mono">
          <span>{formatDuration(progress)}</span>
          <span>{formatDuration(duration || track.duration)}</span>
        </div>
      </div>
    </div>
  );
}
