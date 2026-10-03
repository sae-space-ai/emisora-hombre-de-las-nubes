# 📢 Sistema de Publicidad - UNA Cuña por Track

## ✅ Configuración Actual

El sistema de publicidad ahora funciona con **SOLO UNA cuña al inicio** y **SOLO UNA cuña al final** de cada track.

### 🎯 2 Momentos de Inserción

1. **Al principio de cada track** - Una cuña publicitaria antes de que comience la música
2. **Al final de cada track** - Una cuña publicitaria antes de pasar al siguiente track

**NO hay anuncios cada 10 segundos.**

## 🔄 Cómo Funciona

### Flujo de Reproducción

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UNA cuña al INICIO del Track 1                           │
│    "Chambra, en la Calle Méndez Núñez 1..."                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Track 1 completo suena sin interrupciones                │
│    (3 minutos de música continua)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. UNA cuña al FINAL del Track 1                            │
│    "Boutique Zetta, en la Calle Cervantes 10..."            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UNA cuña al INICIO del Track 2                           │
│    "Arias Moda, en la Calle Real 2..."                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Track 2 completo suena sin interrupciones                │
│    (3 minutos de música continua)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UNA cuña al FINAL del Track 2                            │
│    "Calzados Emilio Salamanca, en la Calle Francisco..."    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (repite el ciclo)
```

## 📊 Ejemplo con Track de 3 Minutos

Para una canción de 3 minutos (180 segundos):

```
0:00  - UNA cuña al inicio (10s)
0:10  - Comienza la música
3:00  - Track termina
3:00  - UNA cuña al final (10s)
3:10  - Siguiente track...
```

**Total de anuncios por track de 3 minutos:**
- 1 cuña al inicio
- 1 cuña al final
- **Total: 2 cuñas**

## 🔧 Implementación Técnica

### Cola de Reproducción

La cola ahora tiene esta estructura simple:

```typescript
[
  { type: 'ad', position: 'start', advertiser: {...} },  // Cuña al inicio
  { type: 'track', track: {...} },                        // Track musical
  { type: 'ad', position: 'end', advertiser: {...} },    // Cuña al final
  { type: 'ad', position: 'start', advertiser: {...} },  // Cuña al inicio
  { type: 'track', track: {...} },                        // Track musical
  { type: 'ad', position: 'end', advertiser: {...} },    // Cuña al final
  ...
]
```

### Código Simplificado

En `src/lib/scheduler.ts`:

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  const queue: QueueItem[] = [];
  let adCounter = 0;

  for (const track of tracks) {
    // UNA cuña al INICIO de cada pista
    queue.push({
      type: 'ad',
      advertiser: getNextAdvertiser(),
      id: `ad-start-${Date.now()}-${adCounter++}`,
      position: 'start',
    });

    // Pista musical
    queue.push({ type: 'track', track });

    // UNA cuña al FINAL de cada pista
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

## 🎯 Ventajas de Esta Implementación

✅ **Muy simple** - Solo 2 cuñas por track  
✅ **No interrumpe la música** - La música suena completa sin pausas  
✅ **Predecible** - Sabes exactamente cuándo aparecerán las cuñas  
✅ **Menos intrusivo** - Solo 2 cuñas en lugar de 19  
✅ **Mejor experiencia de usuario** - La música fluye naturalmente  

## 🧪 Verificación en Consola

Cuando inicies la emisora, verás estos logs:

```
[App] 📢 Reproduciendo anuncio: Chambra
[TTS] 🎙️ Reproduciendo anuncio: "Chambra, en la Calle Méndez Núñez 1..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Marcha de la Esperanza
[App] ▶️ Música comenzando...

... (3 minutos de música sin interrupciones) ...

[App] 📢 Reproduciendo anuncio: Boutique Zetta
[TTS] 🎙️ Reproduciendo anuncio: "Boutique Zetta, en la Calle Cervantes 10..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 📢 Reproduciendo anuncio: Arias Moda
[TTS] 🎙️ Reproduciendo anuncio: "Arias Moda, en la Calle Real 2..."
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado

[App] 🎵 Reproduciendo track: Saetas del Alma
[App] ▶️ Música comenzando...
```

## 📈 Comparación: Antes vs Ahora

### Antes (Anuncios cada 10 segundos)
- **19 anuncios por track de 3 minutos**
- Música interrumpida cada 10 segundos
- Experiencia fragmentada
- Usuario puede sentirse abrumado

### Ahora (Solo 2 cuñas por track)
- **2 cuñas por track de 3 minutos**
- Música continua sin interrupciones
- Experiencia fluida y natural
- Usuario disfruta la música completa

## ⚙️ Configuración

### Cambiar la posición de las cuñas

Si quieres cambiar la posición de las cuñas, modifica `buildQueueWithAds` en `src/lib/scheduler.ts`:

**Solo cuña al inicio:**
```typescript
for (const track of tracks) {
  queue.push({
    type: 'ad',
    advertiser: getNextAdvertiser(),
    position: 'start',
  });
  queue.push({ type: 'track', track });
}
```

**Solo cuña al final:**
```typescript
for (const track of tracks) {
  queue.push({ type: 'track', track });
  queue.push({
    type: 'ad',
    advertiser: getNextAdvertiser(),
    position: 'end',
  });
}
```

**Sin cuñas:**
```typescript
for (const track of tracks) {
  queue.push({ type: 'track', track });
}
```

### Desactivar completamente la publicidad

Modifica `buildQueueWithAds` para que solo devuelva los tracks:

```typescript
function buildQueueWithAds(tracks: AudiusTrack[]): QueueItem[] {
  return tracks.map(track => ({ type: 'track', track }));
}
```

## 📝 Notas Importantes

- **Las cuñas se reproducen con TTS** - No hay archivos de audio externos
- **Rotación inteligente** - Los anunciantes se rotan sin repeticiones consecutivas
- **14 anunciantes disponibles** - Todos de Almendralejo, Categoría 99
- **Duración aproximada** - Cada cuña dura unos 10 segundos

## 🎉 Resumen

El sistema de publicidad ahora funciona con **SOLO 2 cuñas por track**:

✅ **UNA cuña al principio** - Antes de que comience la música  
✅ **UNA cuña al final** - Antes de pasar al siguiente track  

**Nada más. Solo eso. La música suena completa sin interrupciones.**

---

**Sistema de Publicidad Simplificado** - 2 cuñas por track 🎉

*Última actualización: 2025-01-XX*
