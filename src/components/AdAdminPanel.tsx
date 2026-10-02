/**
 * Panel de Administración de Publicidad
 * Permite gestionar anunciantes y configuración
 */

import { useState } from 'react';
import { adScheduler, Advertiser } from '../lib/adScheduler';
import adConfig from '../data/adConfig.json';

export default function AdAdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>(adScheduler.getAllAdvertisers());
  const [adInterval, setAdInterval] = useState(adConfig.adIntervalSeconds);

  const handleToggleAdvertiser = (id: string, enabled: boolean) => {
    adScheduler.toggleAdvertiser(id, enabled);
    setAdvertisers(adScheduler.getAllAdvertisers());
  };

  const handleIntervalChange = (value: number) => {
    setAdInterval(value);
    adScheduler.setAdInterval(value);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all"
        title="Administrar publicidad"
      >
        <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Panel de Administración de Publicidad</h2>
            <p className="text-sm text-white/60 mt-1">Gestiona anunciantes y configuración</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Configuración */}
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">Configuración</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/70 block mb-2">
                  Intervalo entre anuncios: {adInterval} segundos
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={adInterval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>10s</span>
                  <span>60s</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium">Anuncio al inicio de pista</p>
                  <p className="text-xs text-white/50">Reproduce un anuncio antes de cada pista</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/50"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium">Anuncio al final de pista</p>
                  <p className="text-xs text-white/50">Reproduce un anuncio al terminar cada pista</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/50"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Lista de anunciantes */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Anunciantes ({advertisers.length})
              </h3>
              <span className="text-xs text-white/50">
                {advertisers.filter(a => a.enabled).length} activos
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {advertisers.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={ad.enabled}
                      onChange={(e) => handleToggleAdvertiser(ad.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500/50"></div>
                  </label>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{ad.name}</p>
                    <p className="text-xs text-white/50 truncate">{ad.address}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white/40">{ad.duration}s</p>
                    {ad.since && (
                      <p className="text-[10px] text-white/30">Desde {ad.since}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Estadísticas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-300">{advertisers.length}</p>
                <p className="text-xs text-white/50">Total anunciantes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-300">{advertisers.filter(a => a.enabled).length}</p>
                <p className="text-xs text-white/50">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-300">{adInterval}s</p>
                <p className="text-xs text-white/50">Intervalo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
