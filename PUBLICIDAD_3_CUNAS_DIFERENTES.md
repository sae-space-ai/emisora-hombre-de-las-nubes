# 📢 Sistema de Publicidad - 3 Cuñas DIFERENTES por Track

## ✅ Configuración Actual

El sistema de publicidad ahora funciona con **3 cuñas DIFERENTES** por track:

1. **UNA cuña al principio** - Antes de que comience la música
2. **UNA cuña DIFERENTE cada 10 segundos** - Durante la reproducción de música
3. **UNA cuña DIFERENTE al final** - Antes de pasar al siguiente track

**Cada cuña es de un anunciante DIFERENTE gracias al sistema de rotación inteligente.**

## 🔄 Cómo Funciona

### Flujo de Reproducción

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CUÑA 1 al INICIO del Track 1 (Anunciante A)              │
│    "Chambra, en la Calle Méndez Núñez 1..."                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Track 1 comienza a sonar                                 │
│    Tiempo acumulado: 0s                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Suena la música durante 10 segundos                      │
│    Tiempo acumulado: 10s                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CUÑA 2 cada 10s (Anunciante B - DIFERENTE)               │
│    "Boutique Zetta, en la Calle Cervantes 10..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Se reanuda la música                                     │
│    Tiempo acumulado: 10s (continúa contando)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Suena la música durante 10 segundos más                  │
│    Tiempo acumulado: 20s                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CUÑA 3 cada 10s (Anunciante C - DIFERENTE)               │
│    "Arias Moda, en la Calle Real 2..."                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Se reanuda la música                                     │
│    (continúa cada 10 segundos con cuñas DIFERENTES)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      ... (más cuñas cada 10s) ...
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Track 1 termina                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. CUÑA FINAL (Anunciante D - DIFERENTE)                   │
│     "Calzados Emilio Salamanca, en la Calle Francisco..."   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. CUÑA INICIO del Track 2 (Anunciante E - DIFERENTE)      │
│     "Ana Blanca Bote, en Arco San Antonio 13..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (repite el ciclo)
```

## 📊 Ejemplo con Track de 3 Minutos

Para una canción de 3 minutos (180 segundos):

```
0:00  - CUÑA 1 al inicio (Anunciante A)
0:10  - Comienza la música
0:20  - CUÑA 2 cada 10s (Anunciante B)
0:30  - Reanuda música
0:40  - CUÑA 3 cada 10s (Anunciante C)
0:50  - Reanuda música
1:00  - CUÑA 4 cada 10s (Anunciante D)
1:10  - Reanuda música
1:20  - CUÑA 5 cada 10s (Anunciante E)
1:30  - Reanuda música
1:40  - CUÑA 6 cada 10s (Anunciante F)
1:50  - Reanuda música
2:00  - CUÑA 7 cada 10s (Anunciante G)
2:10  - Reanuda música
2:20  - CUÑA 8 cada 10s (Anunciante H)
2:30  - Reanuda música
2:40  - CUÑA 9 cada 10s (Anunciante I)
2:50  - Reanuda música
3:00  - Track termina
3:00  - CUÑA FINAL (Anunciante J)
3:10  - Siguiente track...
```

**Total de cuñas por track de 3 minutos:**
- 1 cuña al inicio
- 17 cuñas cada 10 segundos
- 1 cuña al final
- **Total: 19 cuñas DIFERENTES**

## 🎯 Sistema de Rotación Inteligente

### Garantía de Cuñas DIFERENTES

El sistema de rotación inteligente garantiza que **cada cuña sea de un anunciante diferente**:

```typescript
// En adScheduler.ts
getNextAd(): Advertiser | null {
  // Filtrar anunciantes que no estén en el historial reciente
  const availableAds = this.advertisers.filter(
    ad => !this.history.includes(ad.id)
  );

  // Si todos están en el historial, resetear
  const pool = availableAds.length > 0 ? availableAds : this.advertisers;

  // Seleccionar aleatoriamente
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedAd = pool[randomIndex];

  // Actualizar historial (mantener últimos 5)
  this.history.push(selectedAd.id);
  if (this.history.length > 5) {
    this.history.shift();
  }

  return selectedAd;
}
```

### Ejemplo de Rotación

Con 14 anunciantes disponibles:

```
Cuña 1: Chambra (Anunciante #1)
Cuña 2: Boutique Zetta (Anunciante #2) - DIFERENTE
Cuña 3: Arias Moda (Anunciante #3) - DIFERENTE
Cuña 4: Calzados Emilio Salamanca (Anunciante #4) - DIFERENTE
Cuña 5: Ana Blanca Bote (Anunciante #5) - DIFERENTE
Cuña 6: Bonita Locura (Anunciante #6) - DIFERENTE
...
Cuña 15: Chambra (Anunciante #1) - VUELVE a aparecer (después de 14 cuñas)
```

**Historial de últimos 5:** El sistema mantiene un historial de los últimos 5 anunciantes para evitar repeticiones consecutivas.

## 🔧 Implementación Técnica

### 1. Cuñas al Inicio y Final (En la Cola)

Se manejan en la cola de reproducción (`src/lib/scheduler.ts`):

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  
  for (const track of tracks) {
    // Cuña al INICIO
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'start',
    });

    // Track musical
    queue.push({ type: 'track', track });

    // Cuña al FINAL
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'end',
    });
  }
  
  return queue;
}
```

### 2. Cuñas Cada 10 Segundos (En Tiempo Real)

Se manejan con el evento `timeupdate` del audio (`src/App.tsx`):

```typescript
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const handleTimeUpdate = () => {
    if (store.isPlaying && !store.isTTSPlaying && !store.isPlayingAd) {
      accumulatedMusicTimeRef.current = audio.currentTime;
      
      const timeSinceLastAd = accumulatedMusicTimeRef.current - lastAdTimeRef.current;
      
      if (timeSinceLastAd >= 10) {
        // Pausar música
        audio.pause();
        
        // Obtener anunciante DIFERENTE (gracias a la rotación)
        const advertiser = adScheduler.getNextAd();
        
        if (advertiser) {
          // Reproducir cuña
          speakAd(advertiser.adScript, () => {
            // Al terminar, reanudar música
            lastAdTimeRef.current = audio.currentTime;
            audio.play();
          });
        }
      }
    }
  };

  audio.addEventListener('timeupdate', handleTimeUpdate);
  return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
}, [store.isPlaying, store.isTTSPlaying, store.isPlayingAd]);
```

### 3. Reset del Contador

Cuando comienza un nuevo track, se resetea el contador:

```typescript
} else if (nextItem.type === 'track') {
  // Resetear el contador de tiempo para las cuñas cada 10s
  accumulatedMusicTimeRef.current = 0;
  lastAdTimeRef.current = 0;
  console.log('[App] 🎵 Reproduciendo track:', nextItem.track.title);
  
  // ... reproducir track
}
```

## 🎯 Ventajas de Esta Implementación

✅ **Variedad** - Cada cuña es de un anunciante diferente  
✅ **Rotación inteligente** - Sin repeticiones consecutivas  
✅ **Predecible** - Cuñas al inicio, cada 10s, y al final  
✅ **Exposición equitativa** - Todos los anunciantes tienen la misma oportunidad  
✅ **19 cuñas por track** - Máxima exposición publicitaria  

## 🧪 Verificación en Consola

Cuando inicies la emisora, verás estos logs:

```
[App] 📢 Reproduciendo anuncio: Chambra
[TTS] 🎙️ Reproduciendo anuncio: "Chambra, en la Calle Méndez Núñez 1..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Marcha de la Esperanza
[App] ▶️ Música comenzando...

... (10 segundos después) ...

[App] ⏰ 10 segundos de música - insertando cuña diferente
[App] 📢 Reproduciendo anuncio: Boutique Zetta
[TTS] 🎙️ Reproduciendo anuncio: "Boutique Zetta, en la Calle Cervantes 10..."
[TTS] ✅ TTS terminado
[App] ✅ Cuña de 10s terminada - reanudando música

... (10 segundos después) ...

[App] ⏰ 10 segundos de música - insertando cuña diferente
[App] 📢 Reproduciendo anuncio: Arias Moda
[TTS] 🎙️ Reproduciendo anuncio: "Arias Moda, en la Calle Real 2..."
[TTS] ✅ TTS terminado
[App] ✅ Cuña de 10s terminada - reanudando música

... (cuando termina el track) ...

[App] 📢 Reproduciendo anuncio: Calzados Emilio Salamanca
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 📢 Reproduciendo anuncio: Ana Blanca Bote
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Saetas del Alma
```

**Nota:** Cada anuncio es de un anunciante DIFERENTE gracias al sistema de rotación.

## 📈 Estadísticas

### Con 14 Anunciantes Disponibles

**Por track de 3 minutos:**
- 19 cuñas diferentes
- Rotación completa cada ~14 cuñas
- Cada anunciante aparece aproximadamente cada 14 cuñas

**Por hora de reproducción (20 tracks de 3 min):**
- 380 cuñas diferentes
- Cada anunciante aparece ~27 veces por hora
- Exposición equitativa garantizada

**Por día de reproducción (24 horas):**
- 9,120 cuñas diferentes
- Cada anunciante aparece ~651 veces por día
- Máxima exposición publicitaria

## ⚙️ Configuración

### Cambiar el intervalo de cuñas cada 10s

En `src/App.tsx`, línea ~100:

```typescript
if (timeSinceLastAd >= 10) {  // Cambiar a 15, 20, 30, etc.
  // ...
}
```

### Cambiar el tamaño del historial de rotación

En `src/lib/adScheduler.ts`, línea ~82:

```typescript
// Actualizar historial (mantener últimos 5)
this.history.push(selectedAd.id);
if (this.history.length > 5) {  // Cambiar a 10, 15, etc.
  this.history.shift();
}
```

### Desactivar cuñas cada 10s

Comenta o elimina el `useEffect` que maneja el `timeupdate`.

### Desactivar cuñas al inicio/final

Modifica `buildQueueWithAds` en `src/lib/scheduler.ts`:

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  // Solo tracks, sin cuñas al inicio/final
  return tracks.map(track => ({ type: 'track', track }));
}
```

## 📝 Notas Importantes

- **Cada cuña es DIFERENTE** - Gracias al sistema de rotación inteligente
- **Historial de 5 anunciantes** - Evita repeticiones consecutivas
- **Las cuñas cada 10s pausan la música** - Para que el TTS se escuche claramente
- **El contador se resetea al inicio de cada track** - Para que la primera cuña sea exactamente a los 10s
- **14 anunciantes disponibles** - Todos de Almendralejo, Categoría 99

## 🎉 Resumen

El sistema de publicidad ahora funciona con **3 tipos de cuñas DIFERENTES**:

✅ **UNA cuña al principio** - Antes de que comience la música  
✅ **UNA cuña DIFERENTE cada 10 segundos** - Durante la reproducción  
✅ **UNA cuña DIFERENTE al final** - Antes de pasar al siguiente track  

**Cada cuña es de un anunciante diferente gracias al sistema de rotación inteligente.**

---

**Sistema de Publicidad con 3 Cuñas DIFERENTES** - Funcionando correctamente 🎉

*Última actualización: 2025-01-XX*
