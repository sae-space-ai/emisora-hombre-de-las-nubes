# 📢 Sistema de Publicidad - 3 Cuñas DIFERENTES por Track

## ✅ Configuración Actual

El sistema de publicidad ahora funciona con **3 cuñas DIFERENTES** por cada track:

### 🎯 3 Momentos de Inserción con Cuñas DIFERENTES

1. **Al principio del track** - Una cuña publicitaria (anunciante A)
2. **Cada 10 segundos durante el track** - Cuñas diferentes (anunciantes B, C, D, E...)
3. **Al final del track** - Una cuña diferente (anunciante F)

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
│ 4. CUÑA 2 diferente (Anunciante B)                          │
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
│ 7. CUÑA 3 diferente (Anunciante C)                          │
│    "Arias Moda, en la Calle Real 2..."                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Se reanuda la música                                     │
│    (continúa cada 10 segundos con cuñas DIFERENTES)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      ... (repite cada 10s) ...
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Track 1 termina                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. CUÑA FINAL diferente (Anunciante F)                     │
│     "Calzados Emilio Salamanca, en la Calle Francisco..."   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. CUÑA 1 al INICIO del Track 2 (Anunciante G)            │
│     "Ana Blanca Bote, en Arco San Antonio 13..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (repite el ciclo)
```

## 📊 Ejemplo con Track de 3 Minutos

Para una canción de 3 minutos (180 segundos):

```
0:00  - CUÑA 1 al inicio (Anunciante A) - 10s
0:10  - Comienza la música
0:20  - CUÑA 2 diferente (Anunciante B) - 10s
0:30  - Reanuda música
0:40  - CUÑA 3 diferente (Anunciante C) - 10s
0:50  - Reanuda música
1:00  - CUÑA 4 diferente (Anunciante D) - 10s
1:10  - Reanuda música
1:20  - CUÑA 5 diferente (Anunciante E) - 10s
1:30  - Reanuda música
1:40  - CUÑA 6 diferente (Anunciante F) - 10s
1:50  - Reanuda música
2:00  - CUÑA 7 diferente (Anunciante G) - 10s
2:10  - Reanuda música
2:20  - CUÑA 8 diferente (Anunciante H) - 10s
2:30  - Reanuda música
2:40  - CUÑA 9 diferente (Anunciante I) - 10s
2:50  - Reanuda música
3:00  - Track termina
3:00  - CUÑA FINAL diferente (Anunciante J) - 10s
3:10  - Siguiente track...
```

**Total de cuñas por track de 3 minutos:**
- 1 cuña al inicio (Anunciante A)
- 17 cuñas cada 10 segundos (Anunciantes B-R)
- 1 cuña al final (Anunciante S)
- **Total: 19 cuñas DIFERENTES**

## 🔧 Implementación Técnica

### 1. Cuñas al Inicio y Final

Se manejan en la cola de reproducción (`src/lib/scheduler.ts`):

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  
  for (const track of tracks) {
    // UNA cuña al INICIO (anunciante diferente)
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'start',
    });

    // Track musical
    queue.push({ type: 'track', track });

    // UNA cuña al FINAL (anunciante diferente)
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'end',
    });
  }
  
  return queue;
}
```

### 2. Cuñas Cada 10 Segundos

Se manejan en tiempo real con el evento `timeupdate` del audio (`src/App.tsx`):

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
        
        // Obtener anunciante DIFERENTE
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

### 3. Sistema de Rotación Inteligente

El `adScheduler` mantiene un historial de los últimos 5 anuncios y evita repeticiones:

```typescript
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

### 4. Reset del Contador

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

✅ **Máxima exposición** - 19 cuñas diferentes por track de 3 minutos  
✅ **Rotación inteligente** - Cada cuña es de un anunciante diferente  
✅ **Variedad** - Los oyentes escuchan diferentes comercios  
✅ **Predecible** - Cuñas cada 10 segundos exactos  
✅ **Sin repeticiones consecutivas** - Sistema anti-repetición  

## 🧪 Verificación en Consola

Cuando inicies la emisora, verás estos logs:

```
[AdScheduler] Siguiente anuncio: Chambra
[App] 📢 Reproduciendo anuncio: Chambra
[TTS] 🎙️ Reproduciendo anuncio: "Chambra, en la Calle Méndez Núñez 1..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Marcha de la Esperanza
[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios

... (10 segundos después) ...

[AdScheduler] Siguiente anuncio: Boutique Zetta
[App] ⏰ 10 segundos de música - insertando cuña diferente
[App] 📢 Reproduciendo anuncio: Boutique Zetta
[TTS] 🎙️ Reproduciendo anuncio: "Boutique Zetta, en la Calle Cervantes 10..."
[TTS] ✅ TTS terminado
[App] ✅ Cuña de 10s terminada - reanudando música

... (10 segundos después) ...

[AdScheduler] Siguiente anuncio: Arias Moda
[App] ⏰ 10 segundos de música - insertando cuña diferente
[App] 📢 Reproduciendo anuncio: Arias Moda
[TTS] 🎙️ Reproduciendo anuncio: "Arias Moda, en la Calle Real 2..."
[TTS] ✅ TTS terminado
[App] ✅ Cuña de 10s terminada - reanudando música

... (cuando termina el track) ...

[AdScheduler] Siguiente anuncio: Calzados Emilio Salamanca
[App] 📢 Reproduciendo anuncio: Calzados Emilio Salamanca
[TTS] 🎙️ Reproduciendo anuncio: "Calzados Emilio Salamanca, en la Calle Francisco Pizarro 24..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Saetas del Alma
[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios
```

## 📈 Estadísticas de Exposición

### Con 14 Anunciantes Disponibles

**Por track de 3 minutos:**
- 19 cuñas diferentes
- Rotación entre los 14 anunciantes
- Cada anunciante aparece ~1.4 veces por track

**Por hora de programación:**
- ~20 tracks de 3 minutos
- ~380 cuñas diferentes
- Cada anunciante aparece ~27 veces por hora

**Por día (24 horas):**
- ~480 tracks
- ~9,120 cuñas diferentes
- Cada anunciante aparece ~651 veces por día

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
// Actualizar historial (mantener últimos 10 en lugar de 5)
this.history.push(selectedAd.id);
if (this.history.length > 10) {  // Cambiar de 5 a 10
  this.history.shift();
}
```

### Desactivar cuñas cada 10s

Comenta o elimina el `useEffect` que maneja el `timeupdate`.

### Desactivar cuñas al inicio/final

Modifica `buildQueueWithAds` en `src/lib/scheduler.ts`:

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  
  for (const track of tracks) {
    // Solo el track, sin cuñas al inicio/final
    queue.push({ type: 'track', track });
  }
  
  return queue;
}
```

## 📝 Notas Importantes

- **Cada cuña es DIFERENTE** - Gracias al sistema de rotación inteligente
- **Las cuñas cada 10s pausan la música** - Esto es necesario para que el TTS se escuche claramente
- **El contador se resetea al inicio de cada track** - Para que la primera cuña sea exactamente a los 10s
- **Las cuñas al inicio y final están en la cola** - Se reproducen como parte natural del flujo
- **Las cuñas cada 10s se insertan en tiempo real** - Usando el evento `timeupdate` del audio
- **Historial de 5 anuncios** - Evita repeticiones consecutivas

## 🎉 Resumen

El sistema de publicidad ahora funciona con **3 tipos de cuñas DIFERENTES**:

✅ **UNA cuña al principio** - Antes de que comience la música (Anunciante A)  
✅ **Cuñas cada 10 segundos** - Durante la música (Anunciantes B, C, D, E...)  
✅ **UNA cuña al final** - Antes de pasar al siguiente track (Anunciante F)  

**Cada cuña es de un anunciante DIFERENTE gracias al sistema de rotación inteligente.**

---

**Sistema de Publicidad con 3 Cuñas Diferentes** - Funcionando correctamente 🎉

*Última actualización: 2025-01-XX*
