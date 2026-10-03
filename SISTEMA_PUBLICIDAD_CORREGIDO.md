# 📢 Sistema de Publicidad - Versión Corregida

## ✅ Correcciones Aplicadas

Se ha corregido el sistema de publicidad eliminando la duplicación de módulos y unificando toda la lógica en un sistema simple y funcional.

### Problemas Corregidos

1. **❌ Duplicación de sistemas**: Existían múltiples sistemas de publicidad que se pisaban entre sí
2. **❌ Archivos innecesarios**: Se eliminaron módulos obsoletos (ads.ts, audioMixer.ts, adGenerator.ts, etc.)
3. **❌ Configuración fragmentada**: Se unificó la configuración en un solo lugar
4. **❌ Componentes duplicados**: Se eliminaron AdDisplay y AdAdminPanel redundantes
5. **❌ Dependencias rotas**: Se corrigieron todas las importaciones

### Archivos Eliminados

```
❌ src/lib/ads.ts
❌ src/lib/audioMixer.ts
❌ src/lib/adGenerator.ts
❌ src/lib/audioGenerator.ts
❌ src/lib/adPlayer.ts
❌ src/components/AdDisplay.tsx
❌ src/components/AdAdminPanel.tsx
❌ src/components/AdPlayerComponent.tsx
❌ src/components/AdPlayerDemo.tsx
❌ src/data/adConfig.json
❌ public/audio/ads/ads-config.json
❌ public/audio/ads/README.md
```

### Arquitectura Simplificada

```
src/
├── lib/
│   ├── adScheduler.ts      ← Programador de anuncios (rotación inteligente)
│   └── adSystem.ts         ← Sistema de publicidad unificado
├── store/
│   └── useRadioStore.ts    ← Estado global (importa Advertiser desde adScheduler)
└── App.tsx                  ← Integración directa con el motor de reproducción
```

## 🎯 Cómo Funciona el Sistema Corregido

### Flujo de Publicidad

1. **Anuncio al inicio de pista**
   - Se reproduce antes de que comience la música
   - Usa TTS con el script del anunciante

2. **Anuncios cada 10 segundos**
   - Se insertan durante la reproducción de la pista
   - Esperan al final de la canción para no cortarla
   - Rotación inteligente entre los 14 anunciantes

3. **Anuncio al final de pista**
   - Se reproduce antes de pasar a la siguiente canción
   - Cierra el ciclo de la pista actual

### Rotación Inteligente

- **Historial de últimos 5 anuncios**: Evita repeticiones consecutivas
- **Pool disponible**: Selecciona aleatoriamente entre anunciantes no recientes
- **Reset automático**: Si todos se han reproducido, reinicia el historial

### Integración con el Motor de Reproducción

El sistema de publicidad está completamente integrado en el motor de reproducción:

```typescript
// En App.tsx
const handleAdvance = useCallback(async () => {
  const nextItem = store.advanceToNext();
  
  if (nextItem.type === 'ad') {
    // Reproducir anuncio con TTS
    store.setCurrentAd(nextItem.advertiser);
    store.setIsPlayingAd(true);
    
    const utterance = new SpeechSynthesisUtterance(nextItem.advertiser.adScript);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      store.setIsPlayingAd(false);
      store.setCurrentAd(null);
      handleAdvance(); // Continuar con el siguiente item
    };
    
    window.speechSynthesis.speak(utterance);
  } else if (nextItem.type === 'track') {
    // Reproducir música
    store.setCurrentTrack(nextItem.track);
    // ... lógica de reproducción
  }
}, [...]);
```

## 📊 Anunciantes Disponibles (14 comercios reales)

Todos de la **Categoría 99: Textil, Moda y Accesorios** de Almendralejo:

1. Almacenes Casa Ángel (desde 1962)
2. Ana Blanca Bote
3. Arias Moda (desde 1924)
4. Bonita Locura
5. Boutique Cachemir
6. Boutique Guillermo Rangel
7. Boutique Zetta (desde 1990)
8. Calzados Emilio Salamanca (desde 1968)
9. Celopman
10. Centro Comercial El Zamorano (desde 1907)
11. Chambra (desde 1989)
12. Colores de Venecia
13. Confecciones Alcalá
14. Decor-Textil

## ⚙️ Configuración

La configuración está hardcodeada en `src/lib/adScheduler.ts`:

```typescript
const AD_CONFIG = {
  adIntervalSeconds: 10,        // Anuncio cada 10 segundos
  adMinDurationSeconds: 10,     // Duración mínima
  adMaxDurationSeconds: 30,     // Duración máxima
  enableDucking: true,          // Ducking habilitado
  duckingLevel: 0.2,            // 20% volumen durante anuncio
  duckingFadeSeconds: 0.5,      // Fade de 0.5s
  playAdAtStart: true,          // Anuncio al inicio
  playAdAtEnd: true,            // Anuncio al final
  enableAds: true,              // Sistema habilitado
  maxAdsPerTrack: 10            // Máximo 10 anuncios por pista
};
```

## 🎨 Visualización

Cuando se reproduce un anuncio, se muestra un banner rojo animado:

```tsx
{isPlayingAd && currentAd && (
  <div className="bg-red-600 text-white p-3 rounded-lg animate-pulse shadow-lg">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider font-bold opacity-90">PUBLICIDAD</p>
        <p className="text-sm font-semibold">{currentAd.name}</p>
        <p className="text-xs opacity-80">{currentAd.address}</p>
      </div>
    </div>
  </div>
)}
```

## 🧪 Pruebas

### Verificar que funciona:

1. **Iniciar la emisora**: Pulsar "Iniciar Emisora"
2. **Ver anuncio al inicio**: Debe aparecer un banner rojo con el nombre del anunciante
3. **Escuchar TTS**: Debe reproducirse el script del anunciante en español
4. **Ver música**: Después del anuncio, debe comenzar la música
5. **Esperar 10 segundos**: Debe aparecer otro anuncio
6. **Ver rotación**: Cada anuncio debe ser de un comerciante diferente
7. **Ver anuncio al final**: Antes de cambiar de pista, debe haber otro anuncio

### Logs en consola:

```
[AdScheduler] 14 anunciantes cargados
[AdScheduler] Siguiente anuncio: Chambra
[App] 📢 Reproduciendo anuncio: Chambra
[App] ✅ Anuncio terminado
[AdScheduler] Siguiente anuncio: Boutique Zetta
...
```

## 📈 Estadísticas

El sistema registra:
- Total de anuncios reproducidos
- Anuncios por posición (inicio, medio, final)
- Tiempo acumulado de música
- Historial de últimos 10 anuncios

Acceso desde la consola:
```javascript
import { getAdStats } from './lib/adSystem';
console.log(getAdStats());
```

## 🔧 Personalización

### Cambiar intervalo de anuncios

Editar `src/lib/adScheduler.ts`:
```typescript
const AD_CONFIG = {
  adIntervalSeconds: 15,  // Cambiar de 10 a 15 segundos
  // ...
};
```

### Desactivar anuncios al inicio/final

Editar `src/lib/adScheduler.ts`:
```typescript
const AD_CONFIG = {
  playAdAtStart: false,  // Desactivar anuncio al inicio
  playAdAtEnd: false,    // Desactivar anuncio al final
  // ...
};
```

### Desactivar todo el sistema

Editar `src/lib/adScheduler.ts`:
```typescript
const AD_CONFIG = {
  enableAds: false,  // Desactivar todo el sistema
  // ...
};
```

## ✅ Ventajas del Sistema Corregido

1. **Simple**: Un solo sistema de publicidad, sin duplicaciones
2. **Funcional**: Todos los anuncios se reproducen correctamente
3. **Integrado**: Completamente integrado en el motor de reproducción
4. **Mantenible**: Código limpio y fácil de modificar
5. **Eficiente**: Sin conflictos ni duplicación de lógica
6. **Escalable**: Fácil añadir más anunciantes o cambiar la configuración

## 📝 Notas Importantes

- **TTS en español**: Todos los anuncios usan Text-to-Speech en español
- **Sin archivos de audio**: No requiere archivos MP3 externos
- **Rotación inteligente**: Evita repetir el mismo anunciante consecutivamente
- **No intrusivo**: Espera al final de la canción para insertar anuncios
- **Responsive**: El banner se adapta a cualquier tamaño de pantalla

---

**Sistema de Publicidad Corregido** - Simple, funcional y sin duplicaciones 🎉

*Build exitoso: 2025-01-XX*
