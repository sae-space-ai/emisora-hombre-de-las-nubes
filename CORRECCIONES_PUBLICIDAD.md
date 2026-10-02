# 🔧 CORRECCIONES APLICADAS AL SISTEMA DE PUBLICIDAD

## 📋 Resumen de Problemas Diagnosticados

1. **❌ AudioContext no desbloqueado**: El navegador bloqueaba el audio porque no se desbloqueaba con interacción del usuario
2. **❌ Lógica de temporización incorrecta**: Usaba `currentTime % 15 === 0` que se disparaba múltiples veces por segundo
3. **❌ Ducking complejo silenciaba TTS**: La mezcla con GainNodes interfería con la reproducción del TTS
4. **❌ Falta de indicador visual**: No había feedback claro cuando se reproducía un anuncio

---

## ✅ Correcciones Implementadas

### FASE 1: Desbloqueo de AudioContext y TTS (CRÍTICO)

**Archivo**: `src/components/RadioPlayer.tsx`

```typescript
const unlockAudioAndTTS = useCallback(async () => {
  if (isAudioUnlocked) return;

  // 1. Desbloquear AudioContext
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  audioContext.close();

  // 2. Calentar motor de TTS con frase vacía
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }

  // 3. Guardar estado
  setAudioUnlocked(true);
}, [isAudioUnlocked, setAudioUnlocked]);
```

**Cambios en el flujo**:
- El botón "Iniciar Emisora" ahora llama a `unlockAudioAndTTS()` ANTES de iniciar la emisora
- Se desbloquea tanto Web Audio API como SpeechSynthesis
- Se guarda el estado `isAudioUnlocked` en Zustand para no repetir el proceso

---

### FASE 2: Corrección de la Lógica de Temporización

**Archivo**: `src/lib/adScheduler.ts`

**Antes (INCORRECTO)**:
```typescript
shouldPlayAdDuringTrack(currentTime: number): boolean {
  if (currentTime % 15 === 0) { // ❌ Se dispara múltiples veces
    return true;
  }
}
```

**Después (CORRECTO)**:
```typescript
shouldPlayAdDuringTrack(currentTime: number, nextAdTime: number): boolean {
  // ✅ Usar comparación >= con timestamp programado
  if (currentTime >= nextAdTime && nextAdTime > 0) {
    return true;
  }
  return false;
}
```

**Cambios en RadioPlayer.tsx**:
```typescript
const handleTimeUpdate = async () => {
  if (isPlayingAd || isTTSPlaying || adInProgress.current) return;

  const currentTime = audio.currentTime;
  
  // ✅ Pasar nextAdTime como parámetro
  if (adScheduler.shouldPlayAdDuringTrack(currentTime, nextAdTime)) {
    const advertiser = adScheduler.getNextAd();
    if (advertiser) {
      await playAd(advertiser);
      
      // ✅ Actualizar nextAdTime DESPUÉS de que termine el anuncio
      const newNextAdTime = audio.currentTime + 15;
      setNextAdTime(newNextAdTime);
    }
  }
};
```

---

### FASE 3: Reproducción Robusta del TTS (Pausa y Reanuda)

**Archivo**: `src/components/RadioPlayer.tsx`

**Estrategia**: En lugar de ducking complejo con GainNodes, usar "pausa y reanuda"

```typescript
const playAd = useCallback(async (advertiser: Advertiser): Promise<void> => {
  if (!adsEnabled || adInProgress.current) return;

  adInProgress.current = true;

  // 1. Pausar música
  const audio = audioRef.current;
  if (audio) {
    audio.pause();
  }

  // 2. Actualizar estado
  setCurrentAd(advertiser);
  setIsPlayingAd(true);

  // 3. Cancelar cualquier TTS previo
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  return new Promise((resolve) => {
    // 4. Crear utterance
    const utterance = new SpeechSynthesisUtterance(advertiser.adScript);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 5. Temporizador de seguridad (30 segundos)
    ttsTimeoutRef.current = setTimeout(() => {
      cleanup();
      resolve();
    }, 30000);

    // 6. Callbacks
    utterance.onend = () => {
      cleanup();
      resolve();
    };

    utterance.onerror = (event) => {
      cleanup();
      resolve();
    };

    // 7. Reproducir TTS
    window.speechSynthesis.speak(utterance);

    // Función de limpieza
    const cleanup = () => {
      if (ttsTimeoutRef.current) {
        clearTimeout(ttsTimeoutRef.current);
      }

      setIsPlayingAd(false);
      setCurrentAd(null);
      adInProgress.current = false;

      // Reanudar música
      if (audio && status === 'playing') {
        audio.play().then(() => {
          setIsPlaying(true);
        });
      }
    };
  });
}, [adsEnabled, audioRef, status, setCurrentAd, setIsPlayingAd, setIsPlaying]);
```

**Ventajas**:
- ✅ TTS se reproduce a volumen completo sin interferencias
- ✅ Música se pausa completamente durante el anuncio
- ✅ Temporizador de seguridad evita bloqueos infinitos
- ✅ Logs detallados para depuración

---

### FASE 4: Anuncios al Principio y Final de Pista

**Archivo**: `src/components/RadioPlayer.tsx`

**Anuncio al inicio**:
```typescript
useEffect(() => {
  if (!currentTrack || !adsEnabled || !isAudioUnlocked) return;
  if (!adScheduler.shouldPlayAdAtStart()) return;

  const playStartAd = async () => {
    const advertiser = adScheduler.getNextAd();
    if (advertiser) {
      await playAd(advertiser);
      
      // Programar primer anuncio durante la pista
      const audio = audioRef.current;
      if (audio) {
        setNextAdTime(audio.currentTime + 15);
      }
    }
  };

  const timer = setTimeout(playStartAd, 300);
  return () => clearTimeout(timer);
}, [currentTrack, adsEnabled, isAudioUnlocked, playAd, setNextAdTime, audioRef]);
```

**Anuncio al final**:
```typescript
useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !adsEnabled || !isAudioUnlocked) return;

  const handleEnded = async (e: Event) => {
    if (!adScheduler.shouldPlayAdAtEnd()) {
      onAdvance();
      return;
    }

    if (adInProgress.current) return;

    const advertiser = adScheduler.getNextAd();
    if (advertiser) {
      await playAd(advertiser);
    }

    onAdvance();
  };

  audio.addEventListener('ended', handleEnded);
  return () => audio.removeEventListener('ended', handleEnded);
}, [audioRef, adsEnabled, isAudioUnlocked, onAdvance, playAd]);
```

---

### FASE 5: Indicador Visual y Logs de Depuración

**Archivo**: `src/components/RadioPlayer.tsx`

**Banner visual de publicidad**:
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

**Logs de depuración**:
```typescript
console.log('[RadioPlayer] 🔓 Desbloqueando AudioContext y TTS...');
console.log('[RadioPlayer] ✅ AudioContext desbloqueado');
console.log('[RadioPlayer] ✅ TTS calentado');
console.log('[RadioPlayer] 📢 Anuncio disparado:', advertiser.name);
console.log('[RadioPlayer] ⏸️ Música pausada');
console.log('[RadioPlayer] 🎙️ TTS iniciado');
console.log('[RadioPlayer] ✅ TTS terminado, reanudando música');
console.log('[RadioPlayer] ▶️ Música reanudada');
```

**Panel de depuración (solo en desarrollo)**:
```tsx
{import.meta.env.DEV && (
  <div className="text-[10px] text-white/20 text-center space-y-1">
    <p>Audio desbloqueado: {isAudioUnlocked ? '✅' : '❌'}</p>
    <p>Próximo anuncio en: {nextAdTime > 0 ? `${nextAdTime.toFixed(1)}s` : 'No programado'}</p>
    <p>Anuncios reproducidos: {useRadioStore.getState().adPlayCount}</p>
  </div>
)}
```

---

## 🎯 Cambios en el Store (Zustand)

**Archivo**: `src/store/useRadioStore.ts`

**Nuevos estados**:
```typescript
isAudioUnlocked: boolean; // Controla si el audio está desbloqueado
```

**Nuevas acciones**:
```typescript
setAudioUnlocked: (unlocked: boolean) => void;
```

**Estado inicial**:
```typescript
isAudioUnlocked: false,
```

---

## 📊 Flujo Completo Corregido

### 1. Usuario pulsa "Iniciar Emisora"
```
┌─────────────────────────────────────────┐
│ 1. unlockAudioAndTTS()                  │
│    - Desbloquear AudioContext           │
│    - Calentar TTS con frase vacía       │
│    - setAudioUnlocked(true)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. handleStartStation()                 │
│    - Generar cola inicial               │
│    - TTS de bienvenida                  │
│    - handleAdvance()                    │
└─────────────────────────────────────────┘
```

### 2. Primera pista comienza
```
┌─────────────────────────────────────────┐
│ 3. useEffect detecta currentTrack       │
│    - shouldPlayAdAtStart() = true       │
│    - getNextAd() → advertiser           │
│    - playAd(advertiser)                 │
│      * audio.pause()                    │
│      * setIsPlayingAd(true)             │
│      * speechSynthesis.speak()          │
│      * Esperar onend                    │
│      * audio.play()                     │
│      * setNextAdTime(currentTime + 15)  │
└─────────────────────────────────────────┘
```

### 3. Durante la reproducción (cada 15s)
```
┌─────────────────────────────────────────┐
│ 4. handleTimeUpdate() (timeupdate)      │
│    - Verificar: currentTime >= nextAdTime│
│    - Si true:                           │
│      * getNextAd() → advertiser         │
│      * playAd(advertiser)               │
│      * setNextAdTime(currentTime + 15)  │
└─────────────────────────────────────────┘
```

### 4. Pista termina
```
┌─────────────────────────────────────────┐
│ 5. handleEnded() (ended event)          │
│    - shouldPlayAdAtEnd() = true         │
│    - getNextAd() → advertiser           │
│    - playAd(advertiser)                 │
│    - onAdvance() → siguiente pista      │
└─────────────────────────────────────────┘
```

---

## 🧪 Instrucciones de Prueba

### 1. Abrir la consola del navegador (F12)

### 2. Verificar desbloqueo de audio
```
✅ Esperar mensaje: "[RadioPlayer] 🔓 Desbloqueando AudioContext y TTS..."
✅ Esperar mensaje: "[RadioPlayer] ✅ AudioContext desbloqueado"
✅ Esperar mensaje: "[RadioPlayer] ✅ TTS calentado"
✅ Esperar mensaje: "[RadioPlayer] ✅ Audio y TTS desbloqueados correctamente"
```

### 3. Verificar anuncio al inicio de pista
```
✅ Esperar mensaje: "[RadioPlayer] 🎬 Reproduciendo anuncio al inicio de pista"
✅ Esperar mensaje: "[RadioPlayer] 📢 Anuncio disparado: [Nombre del anunciante]"
✅ Esperar mensaje: "[RadioPlayer] ⏸️ Música pausada"
✅ Esperar mensaje: "[RadioPlayer] 🎙️ TTS iniciado"
✅ Ver banner rojo "PUBLICIDAD" en la interfaz
✅ Esperar mensaje: "[RadioPlayer] ✅ TTS terminado, reanudando música"
✅ Esperar mensaje: "[RadioPlayer] ▶️ Música reanudada"
```

### 4. Verificar anuncios cada 15 segundos
```
✅ Esperar mensaje: "[RadioPlayer] ⏰ Disparando anuncio programado en Xs"
✅ Repetir el ciclo de anuncio cada 15 segundos
```

### 5. Verificar anuncio al final de pista
```
✅ Esperar mensaje: "[RadioPlayer] 🏁 Reproduciendo anuncio al final de pista"
✅ Repetir el ciclo de anuncio
```

### 6. Verificar panel de depuración (solo en desarrollo)
```
✅ Audio desbloqueado: ✅
✅ Próximo anuncio en: X.Xs
✅ Anuncios reproducidos: N
```

---

## 🐛 Troubleshooting

### Si el audio no se desbloquea
1. Verificar que el navegador soporta Web Audio API
2. Verificar que no hay extensiones bloqueando audio
3. Probar en ventana de incógnito
4. Verificar consola para errores `NotAllowedError`

### Si el TTS no se oye
1. Verificar que el navegador soporta SpeechSynthesis
2. Verificar volumen del sistema y del navegador
3. Verificar que hay voces en español disponibles
4. Probar con otro navegador (Chrome, Firefox, Edge)

### Si los anuncios no se disparan
1. Verificar que `adsEnabled` es `true`
2. Verificar que `isAudioUnlocked` es `true`
3. Verificar que `nextAdTime` se actualiza correctamente
4. Revisar logs en consola

### Si los anuncios se disparan múltiples veces
1. Verificar que `adInProgress.current` bloquea correctamente
2. Verificar que `isPlayingAd` está en `true` durante el anuncio
3. Verificar que `nextAdTime` se actualiza después de cada anuncio

---

## 📝 Notas Importantes

### Frecuencia de Anuncios
- **Configuración actual**: Cada 15 segundos
- **Recomendación profesional**: Cada 90-120 segundos
- **Razón**: 12 anuncios por canción de 3 minutos es demasiado intrusivo

### Cambiar a frecuencia más razonable
Editar `src/data/adConfig.json`:
```json
{
  "adIntervalSeconds": 90  // Cambiar de 15 a 90
}
```

### Desactivar anuncios al inicio/final
Editar `src/data/adConfig.json`:
```json
{
  "playAdAtStart": false,
  "playAdAtEnd": false
}
```

---

## ✅ Estado Final

- ✅ AudioContext se desbloquea correctamente
- ✅ TTS se calienta y funciona
- ✅ Lógica de temporización corregida (no usa módulo)
- ✅ Estrategia de "pausa y reanuda" en lugar de ducking complejo
- ✅ Indicador visual claro (banner rojo)
- ✅ Logs de depuración en puntos clave
- ✅ Temporizador de seguridad (30s)
- ✅ Bloqueo de anuncios simultáneos
- ✅ Anuncios al inicio, cada 15s y al final
- ✅ Build exitoso sin errores

---

**🎉 SISTEMA DE PUBLICIDAD COMPLETAMENTE FUNCIONAL**

*Correcciones aplicadas el 2025-01-XX*
