/**
 * Componente ScheduleDisplay
 * Muestra la parrilla de programación del día actual
 * Resalta el bloque actual y muestra los próximos
 */

import { getTodayProgramGuide, getCurrentDayName } from '../lib/scheduler';

export default function ScheduleDisplay() {
  const program = getTodayProgramGuide();
  const dayName = getCurrentDayName();

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          Programación de hoy
        </h3>
        <span className="text-xs text-white/30 font-medium">{dayName}</span>
      </div>

      <div className="space-y-1.5">
        {program.map((block, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              block.isCurrent
                ? 'bg-purple-500/10 border border-purple-500/20'
                : block.isPast
                ? 'opacity-30'
                : 'hover:bg-white/[0.02]'
            }`}
          >
            {/* Icono */}
            <span className="text-lg flex-shrink-0">{block.icon}</span>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium truncate ${
                  block.isCurrent ? 'text-purple-200' : 'text-white/60'
                }`}>
                  {block.name}
                </span>
                {block.isCurrent && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 font-bold animate-pulse">
                    AHORA
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/30 truncate">
                {block.description}
              </p>
            </div>

            {/* Hora */}
            <span className={`text-[10px] font-mono flex-shrink-0 ${
              block.isCurrent ? 'text-purple-300/70' : 'text-white/20'
            }`}>
              {String(block.startHour).padStart(2, '0')}:00–{String(block.endHour).padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
