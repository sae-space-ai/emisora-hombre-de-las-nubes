# 📢 Sistema de Publicidad Simplificado

## ✅ Configuración Actual

El sistema de publicidad ahora funciona **exactamente** como solicitaste:

### 🎯 3 Momentos de Inserción

1. **Al principio de cada track** - Anuncio antes de que comience la música
2. **Cada 10 segundos** - Anuncio durante la reproducción de música
3. **Al final de cada track** - Anuncio antes de pasar al siguiente track

## 🔄 Cómo Funciona

### Flujo de Reproducción

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Anuncio al INICIO del Track 1                            │
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
│ 4. Se pausa la música y se reproduce anuncio                │
│    "Boutique Zetta, en la Calle Cervantes 10..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Se reanuda la música desde donde se pausó                │
│    Tiempo acumulado: 10s (continúa contando)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Suena la música durante 10 segundos más                  │
│    Tiempo acumulado: 20s                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Se pausa la música y se reproduce otro anuncio           │
│    "Arias Moda, en la Calle Real 2..."                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Se reanuda la música                                     │
│    (continúa cada 10 segundos hasta que termine el track)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Track 1 termina                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Anuncio al FINAL del Track 1                            │
│     "Calzados Emilio Salamanca, en la Calle Francisco..."   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Anuncio al INICIO del Track 2                           │
│     "Ana Blanca Bote, en Arco San Antonio 13..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Track 2 comienza a sonar                                │
│     Tiempo acumulado: 0s (se resetea)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (repite el ciclo)
```

## 📊 Ejemplo con Track de 3 Minutos

Para una canción de 3 minutos (180 segundos):

```
0:00  - Anuncio al inicio (10s)
0:10  - Comienza la música
0:20  - Anuncio cada 10s (10s)
0:30  - Reanuda música
0:40  - Anuncio cada 10s (10s)
0:50  - Reanuda música
1:00  - Anuncio cada 10s (10s)
1:10  - Reanuda música
1:20  - Anuncio cada 10s (10s)
1:30  - Reanuda música
1:40  - Anuncio cada 10s (10s)
1:50  - Reanuda música
2:00  - Anuncio cada 10s (10s)
2:10  - Reanuda música
2:20  - Anuncio cada 10s (10s)
2:30  - Reanuda música
2:40  - Anuncio cada 10s (10s)
2:50  - Reanuda música
3:00  - Track termina
3:00  - Anuncio al final (10s)
3:10  - Siguiente track...
```

**Total de anuncios por track de 3 minutos:**
- 1 anuncio al inicio
- 17 anuncios cada 10 segundos
- 1 anuncio al final
- **Total: 19 anuncios**

## 🔧 Implementación Técnica

### 1. Anuncios al Inicio y Final

Se manejan en la cola de reproducción (`src/lib/scheduler.ts`):

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  
  for (const track of tracks) {
    // Anuncio al INICIO
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'start',
    });

    // Track musical
    queue.push({ type: 'track', track });

    // Anuncio al FINAL
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      position: 'end',
    });
  }
  
  return queue;
}
```

### 2. Anuncios Cada 10 Segundos

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
        
        // Obtener anunciante
        const advertiser = adScheduler.getNextAd();
        
        if (advertiser) {
          // Reproducir anuncio
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
  // Resetear el contador de tiempo acumulado
  accumulatedMusicTimeRef.current = 0;
  lastAdTimeRef.current = 0;
  console.log('[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios');
  
  // ... reproducir track
}
```

## 🎯 Ventajas de Esta Implementación

✅ **Simple y clara** - Solo 3 momentos de inserción  
✅ **Predecible** - Sabes exactamente cuándo aparecerán los anuncios  
✅ **No interrumpe la música bruscamente** - Los anuncios cada 10s pausan la música suavemente  
✅ **Contador preciso** - Se resetea al inicio de cada track  
✅ **Rotación inteligente** - Los anunciantes se rotan sin repeticiones consecutivas  

## 🧪 Verificación en Consola

Cuando inicies la emisora, verás estos logs:

```
[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios
[App] 📢 Reproduciendo anuncio: Chambra
[TTS] 🎙️ Reproduciendo anuncio: "Chambra, en la Calle Méndez Núñez 1..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado
[App] 🎵 Track comenzando...

... (10 segundos después) ...

[App] ⏰ 10 segundos de música acumulada - insertando anuncio
[App] 📢 Reproduciendo anuncio: Boutique Zetta
[TTS] 🎙️ Reproduciendo anuncio: "Boutique Zetta, en la Calle Cervantes 10..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio de 10s terminado - reanudando música

... (10 segundos después) ...

[App] ⏰ 10 segundos de música acumulada - insertando anuncio
[App] 📢 Reproduciendo anuncio: Arias Moda
...

... (cuando termina el track) ...

[App] 📢 Reproduciendo anuncio: Calzados Emilio Salamanca
[App] ✅ Anuncio terminado
[App] 🎵 Nuevo track iniciado - reseteando contador de anuncios
```

## ⚙️ Configuración

### Cambiar el intervalo de anuncios cada 10s

En `src/App.tsx`, línea ~100:

```typescript
if (timeSinceLastAd >= 10) {  // Cambiar a 15, 20, 30, etc.
  // ...
}
```

### Desactivar anuncios cada 10s

Comenta o elimina el `useEffect` que maneja el `timeupdate`.

### Desactivar anuncios al inicio/final

Modifica `buildQueueWithAds` en `src/lib/scheduler.ts`:

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  
  for (const track of tracks) {
    // Solo el track, sin anuncios al inicio/final
    queue.push({ type: 'track', track });
  }
  
  return queue;
}
```

## 📝 Notas Importantes

- **Los anuncios cada 10s pausan la música** - Esto es necesario para que el TTS se escuche claramente
- **El contador se resetea al inicio de cada track** - Para que el primer anuncio sea exactamente a los 10s
- **Los anuncios al inicio y final están en la cola** - Se reproducen como parte natural del flujo
- **Los anuncios cada 10s se insertan en tiempo real** - Usando el evento `timeupdate` del audio

## 🎉 Resumen

El sistema de publicidad ahora funciona **exactamente** como solicitaste:

✅ **Al principio de cada track** - Anuncio antes de la música  
✅ **Cada 10 segundos** - Anuncio durante la música (pausando suavemente)  
✅ **Al final de cada track** - Anuncio antes del siguiente track  

**Nada más. Solo eso.**

---

**Sistema de Publicidad Simplificado** - Funcionando correctamente 🎉

*Última actualización: 2025-01-XX*
