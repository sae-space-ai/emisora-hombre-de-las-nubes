/**
 * StationHeader - Cabecera con indicador EN VIVO
 */

import { useRadioStore } from '../store/useRadioStore';
import { getCurrentDayName, getCurrentTimeString } from '../lib/scheduler';

export default function StationHeader() {
  const { status, catalog, tracksPlayedCount } = useRadioStore();
  const isLive = status === 'playing' || status === 'tts';

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20"></div>
      <div className="relative px-4 py-5 md:px-8 md:py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-2xl md:text-3xl">☁️</span>
              </div>
              {isLive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-slate-900"></div>
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 bg-clip-text text-transparent leading-tight">
                El Hombre de las Nubes
              </h1>
              <p className="text-xs md:text-sm text-purple-300/60 font-medium">
                Radio Autónoma 24/7 • Prof. Manuel Gago Fernández
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              isLive ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-white/5 border-white/10 text-white/40'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}></div>
              <span className="text-xs font-bold tracking-wider">{isLive ? 'EN VIVO' : 'OFFLINE'}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
              <span className="font-mono">{getCurrentTimeString()}</span>
              <span>•</span>
              <span>{getCurrentDayName()}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
              <span>🎧 {tracksPlayedCount}/{catalog.length}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
