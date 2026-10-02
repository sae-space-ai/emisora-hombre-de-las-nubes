/**
 * PlaylistQueue - Lista de próximos QueueItems (tracks + TTS markers)
 */

import { QueueItem } from '../lib/scheduler';
import { getTrackArtwork, formatDuration, classifyTrack, CATEGORY_LABELS, CATEGORY_BADGE } from '../lib/audius';

interface PlaylistQueueProps {
  queue: QueueItem[];
  currentIndex: number;
}

export default function PlaylistQueue({ queue, currentIndex }: PlaylistQueueProps) {
  // Mostrar próximos 10 items desde currentIndex + 1
  const upcoming = queue.slice(currentIndex + 1, currentIndex + 11);

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
          </svg>
          Próximos en cola
        </h3>
        <span className="text-xs text-white/30">{queue.length - currentIndex - 1} restantes</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-white/30">Generando nueva cola...</p>
          <div className="mt-2 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-3 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
          {upcoming.map((item, index) => {
            if (item.type === 'tts') {
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <span className="text-[10px] text-purple-400/40 w-5 text-right font-mono">{index + 1}</span>
                  <span className="text-sm">🔊</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-purple-300/60 italic truncate">
                      {item.message || 'Locución TTS'}
                    </p>
                  </div>
                  <span className="text-[9px] text-purple-400/40 px-1.5 py-0.5 rounded bg-purple-500/10">TTS</span>
                </div>
              );
            }

            if (item.type === 'ad') {
              const positionLabel = item.position === 'start' ? '🎬' : item.position === 'end' ? '🏁' : '⏱️';
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <span className="text-[10px] text-amber-400/40 w-5 text-right font-mono">{index + 1}</span>
                  <span className="text-sm">{positionLabel}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-amber-300/60 font-medium truncate">
                      📢 {item.advertiser.name}
                    </p>
                    <p className="text-[9px] text-amber-400/40 truncate">
                      {item.advertiser.address}
                    </p>
                  </div>
                  <span className="text-[9px] text-amber-400/40 px-1.5 py-0.5 rounded bg-amber-500/10">AD</span>
                </div>
              );
            }

            const track = item.track;
            const category = classifyTrack(track);
            const artwork = getTrackArtwork(track);

            return (
              <div key={`${track.id}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all group">
                <span className="text-[10px] text-white/20 w-5 text-right font-mono group-hover:text-white/40">{index + 1}</span>
                <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-purple-900/30">
                  {artwork ? (
                    <img src={artwork} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-40">🎵</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">{track.title}</p>
                  <p className="text-[10px] text-white/30">{formatDuration(track.duration)}</p>
                </div>
                <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] border ${CATEGORY_BADGE[category]}`}>
                  {CATEGORY_LABELS[category]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {queue.length - currentIndex - 1 > 10 && (
        <div className="mt-2 pt-2 border-t border-white/5 text-center">
          <span className="text-[10px] text-white/20">+{queue.length - currentIndex - 11} items más</span>
        </div>
      )}
    </div>
  );
}
