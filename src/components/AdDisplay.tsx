/**
 * Componente de visualización de anuncios publicitarios
 * Muestra información del anunciante durante la reproducción del anuncio
 */

import { Advertiser } from '../lib/ads';

interface AdDisplayProps {
  advertiser: Advertiser | null;
  isVisible: boolean;
}

export default function AdDisplay({ advertiser, isVisible }: AdDisplayProps) {
  if (!isVisible || !advertiser) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-amber-500/95 to-orange-500/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2 border-amber-400/50 max-w-md">
        {/* Header del anuncio */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Publicidad</span>
          </div>
          <div className="flex-1"></div>
          <span className="text-[10px] text-white/70">{advertiser.duration}s</span>
        </div>

        {/* Contenido del anuncio */}
        <div className="bg-white/10 rounded-xl p-3 space-y-2">
          {/* Nombre y categoría */}
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {advertiser.name}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              {advertiser.category}
            </p>
          </div>

          {/* Descripción */}
          <p className="text-xs text-white/90 leading-relaxed">
            {advertiser.description}
          </p>

          {/* Dirección */}
          {advertiser.address && (
            <div className="flex items-start gap-1.5 pt-1">
              <svg className="w-3 h-3 text-white/60 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <p className="text-[11px] text-white/70">
                {advertiser.address}
              </p>
            </div>
          )}

          {/* Teléfono */}
          {advertiser.phone && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
              <p className="text-[11px] text-white/70">
                {advertiser.phone}
              </p>
            </div>
          )}

          {/* Desde */}
          {advertiser.since && (
            <div className="flex items-center gap-1.5 pt-1">
              <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <p className="text-[11px] text-white/70">
                Desde {advertiser.since}
              </p>
            </div>
          )}
        </div>

        {/* Animación de ondas */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-white/60 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 12}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '0.8s',
              }}
            ></div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
