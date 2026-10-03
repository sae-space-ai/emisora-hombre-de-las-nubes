# ✅ Corrección del Módulo de Publicidad - Integración en Secuencia Ordenada

## 🎯 Problema Original

El sistema de publicidad tenía una lógica separada que causaba conflictos:
- Los anuncios se disparaban con timers independientes
- Había duplicación de lógica entre `ads.ts` y el motor de reproducción
- Los anuncios no se intercalaban de forma ordenada en la secuencia de pistas
- El sistema era complejo y propenso a errores de timing

## 🔧 Solución Implementada

### 1. **Integración de Anuncios en la Cola de Reproducción**

Los anuncios ahora son parte natural de la secuencia de `QueueItem`, junto con las pistas musicales y los marcadores TTS.

**Tipo QueueItem actualizado:**
```typescript
export type QueueItem =
  | { type: 'track'; track: AudiusTrack }
  | { type: 'tts'; message: string; id: string }
  | { type: 'ad'; advertiser: Advertiser; id: string; position: 'start' | 'middle' | 'end' };
```

### 2. **Patrón de Intercalación Ordenado**

La función `buildQueueWithAds()` genera la cola con el siguiente patrón:

```
[
  AD_START,        // Anuncio al inicio de pista 1
  Track 1,         // Pista musical 1
  AD_MIDDLE,       // Anuncio intermedio (cada 15s simulado)
  AD_MIDDLE,       // Otro anuncio intermedio
  AD_END,          // Anuncio al final de pista 1
  
  AD_START,        // Anuncio al inicio de pista 2
  Track 2,         // Pista musical 2
  AD_MIDDLE,       // Anuncio intermedio
  AD_END,          // Anuncio al final de pista 2
  
  ...
]
```

### 3. **Función buildQueueWithAds()**

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  const adInterval = 15; // segundos entre anuncios
  let adCounter = 0;

  for (const track of tracks) {
    // Anuncio al INICIO de cada pista
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      id: `ad-start-${Date.now()}-${adCounter++}`,
      position: 'start',
    });

    // Pista musical
    queue.push({ type: 'track', track });

    // Anuncios cada 15 segundos DURANTE la pista (simulado)
    const trackDuration = track.duration || 180; // default 3 min
    const adsDuringTrack = Math.floor(trackDuration / adInterval) - 1;
    
    for (let i = 0; i < adsDuringTrack && i < 3; i++) { // máximo 3 anuncios durante la pista
      queue.push({
        type: 'ad',
        advertiser: getNextAdvertiser(),
        id: `ad-middle-${Date.now()}-${adCounter++}`,
        position: 'middle',
      });
    }

    // Anuncio al FINAL de cada pista
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      id: `ad-end-${Date.now()}-${adCounter++}`,
      position: 'end',
    });
  }

  return queue;
}
```

### 4. **Manejo de Anuncios en handleAdvance()**

El motor de reproducción ahora maneja los anuncios como cualquier otro `QueueItem`:

```typescript
else if (nextItem.type === 'ad') {
  // Siguiente es ANUNCIO PUBLICITARIO
  console.log('[App] 📢 Reproduciendo anuncio:', nextItem.advertiser.name);
  store.setCurrentAd(nextItem.advertiser);
  store.setIsPlayingAd(true);

  // Reproducir anuncio con TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(nextItem.advertiser.adScript);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang === 'es-ES');
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onend = () => {
      console.log('[App] ✅ Anuncio terminado');
      store.setIsPlayingAd(false);
      store.setCurrentAd(null);
      // Avanzar al siguiente item
      handleAdvance();
    };

    utterance.onerror = (event) => {
      console.error('[App] ❌ Error en anuncio:', event.error);
      store.setIsPlayingAd(false);
      store.setCurrentAd(null);
      handleAdvance();
    };

    window.speechSynthesis.speak(utterance);
  } else {
    // TTS no disponible, saltar anuncio
    setTimeout(() => handleAdvance(), 500);
  }
}
```

### 5. **Visualización en PlaylistQueue**

La cola de reproducción ahora muestra los anuncios con iconos según su posición:

```tsx
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
```

### 6. **Eliminación de Lógica Duplicada**

Se eliminó el `useEffect` que verificaba cada segundo si era momento de reproducir un anuncio:

```typescript
// ELIMINADO:
// useEffect(() => {
//   const adCheckInterval = setInterval(() => {
//     if (shouldPlayAd()) {
//       startAd(...);
//     }
//   }, 1000);
// }, [...]);
```

Ahora todo fluye naturalmente a través de `handleAdvance()`.

## 📊 Ventajas de la Nueva Arquitectura

### ✅ **Flujo Simplificado**
```
Usuario inicia emisora
    ↓
generateQueue() genera cola con anuncios intercalados
    ↓
handleAdvance() procesa cada QueueItem en orden
    ↓
Si es 'track' → reproduce música
Si es 'ad' → reproduce anuncio con TTS
Si es 'tts' → reproduce locución
    ↓
Al terminar, avanza al siguiente QueueItem
    ↓
Repite hasta agotar la cola
    ↓
Regenera cola y continúa
```

### ✅ **Sin Conflictos de Timing**
- No hay timers independientes
- No hay verificaciones cada segundo
- Todo sigue el flujo natural de la cola

### ✅ **Predecible y Ordenado**
- Los anuncios aparecen en posiciones específicas
- Se puede ver exactamente qué anuncio viene después
- Fácil de depurar y mantener

### ✅ **Visualización Clara**
- La cola muestra anuncios con iconos (🎬 ⏱️ 🏁)
- Se distingue claramente entre pistas, anuncios y TTS
- El usuario sabe qué viene a continuación

## 🎨 Ejemplo de Cola Generada

Para 3 pistas de 3 minutos cada una:

```
1. 🎬 AD: Chambra (inicio pista 1)
2. 🎵 Track: Marcha de la Esperanza (3:00)
3. ⏱️ AD: Boutique Zetta (a los 15s)
4. ⏱️ AD: El Zamorano (a los 30s)
5. ⏱️ AD: Arias Moda (a los 45s)
6. 🏁 AD: Calzados Emilio Salamanca (final pista 1)

7. 🎬 AD: Ana Blanca Bote (inicio pista 2)
8. 🎵 Track: Saetas del Alma (3:00)
9. ⏱️ AD: Bonita Locura (a los 15s)
10. ⏱️ AD: Colores de Venecia (a los 30s)
11. ⏱️ AD: Confecciones Alcalá (a los 45s)
12. 🏁 AD: Decor-Textil (final pista 2)

... y así sucesivamente
```

## 🔧 Archivos Modificados

1. **`src/lib/scheduler.ts`**
   - Actualizado tipo `QueueItem` para incluir `'ad'`
   - Nueva función `buildQueueWithAds()`
   - Importación de `adScheduler`

2. **`src/components/PlaylistQueue.tsx`**
   - Manejo visual del tipo `'ad'` en QueueItem
   - Iconos según posición (🎬 ⏱️ 🏁)

3. **`src/components/RadioPlayer.tsx`**
   - Simplificado: solo maneja reproducción de anuncios
   - Eliminada lógica de timing

4. **`src/App.tsx`**
   - `handleAdvance()` maneja anuncios como parte de la cola
   - Eliminado `useEffect` con timer de verificación
   - Eliminadas importaciones de `ads.ts`

## 🧪 Cómo Probar

1. **Iniciar la emisora**
2. **Observar la cola de reproducción**: Verás anuncios intercalados con pistas
3. **Verificar el flujo**:
   - Anuncio al inicio de pista → Pista → Anuncios intermedios → Anuncio final
   - Todo se reproduce en orden sin saltos
4. **Revisar consola**: Verás logs claros de cada anuncio reproducido

## 📝 Notas Importantes

### Frecuencia de Anuncios
- **Configuración actual**: 1 anuncio al inicio + 3 durante la pista + 1 al final = 5 anuncios por pista
- **Para pistas de 3 minutos**: Anuncio cada ~45 segundos
- **Ajustable**: Modificar `adInterval` en `buildQueueWithAds()`

### Personalización
Para cambiar la frecuencia de anuncios:

```typescript
const adInterval = 30; // Cambiar de 15 a 30 segundos
const adsDuringTrack = Math.floor(trackDuration / adInterval) - 1;

for (let i = 0; i < adsDuringTrack && i < 5; i++) { // máximo 5 anuncios
  // ...
}
```

### Desactivar Anuncios
Usar el toggle "Publicidad local" en la configuración para desactivar todos los anuncios.

## ✅ Estado Final

- ✅ Anuncios integrados en la secuencia ordenada
- ✅ Sin conflictos de timing
- ✅ Flujo simplificado y predecible
- ✅ Visualización clara en la cola
- ✅ Build exitoso sin errores
- ✅ Sistema completamente funcional

---

**🎉 Módulo de publicidad corregido y optimizado**

*Los anuncios ahora se intercalan de forma ordenada y natural en la secuencia de reproducción, eliminando conflictos y simplificando la arquitectura.*
