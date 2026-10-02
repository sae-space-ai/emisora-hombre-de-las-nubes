/**
 * Componente Visualizer
 * Barras animadas que simulan un espectro de audio
 * Se activa cuando la radio está reproduciendo
 */

import { useRadioStore } from '../store/useRadioStore';

export default function Visualizer() {
  const { status } = useRadioStore();
  const isActive = status === 'playing' || status === 'tts';

  // Generar barras con alturas y delays aleatorios
  const bars = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    baseHeight: 4 + Math.random() * 4,
    maxHeight: 16 + Math.random() * 24,
    duration: 0.4 + Math.random() * 0.6,
    delay: i * 30 + Math.random() * 100,
  }));

  if (!isActive) {
    return (
      <div className="flex items-end justify-center gap-[2px] h-10 opacity-20">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="w-[3px] rounded-full bg-white/20"
            style={{ height: `${bar.baseHeight}px` }}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-[2px] h-10">
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="w-[3px] rounded-full bg-gradient-to-t from-purple-500 to-indigo-400 opacity-70"
          style={{
            animation: `visualizer-bar ${bar.duration}s ease-in-out ${bar.delay}ms infinite alternate`,
            height: `${bar.baseHeight}px`,
          }}
        ></div>
      ))}
      
      <style>{`
        @keyframes visualizer-bar {
          0% { height: 4px; opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { height: 32px; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
