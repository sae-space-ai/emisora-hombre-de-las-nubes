# 📢 Sistema de Publicidad Simple - Guía de Integración

## ✅ Implementación Completada

Se ha creado un sistema de publicidad **simple e independiente** que cumple exactamente con tus requisitos:

### Características Implementadas

✅ **Publicidad al comienzo**: Al pulsar Play, reproduce `ad_start.mp3` antes de la música  
✅ **Publicidad cada 10 segundos**: Inserta anuncios entre canciones (espera al final de cada canción)  
✅ **Publicidad al final**: Reproduce `ad_end.mp3` al terminar la lista (no si pulsas Stop)  
✅ **Una única cola de audio**: Todo se reproduce en el mismo elemento `<audio>`  
✅ **Sin reproducción simultánea**: Nunca suena música y publicidad a la vez  
✅ **Sin anuncios acumulados**: Sistema anti-acumulación implementado  
✅ **Orden de canciones mantenido**: La cola musical respeta el orden original  
✅ **Sin silencios innecesarios**: Transiciones fluidas entre archivos  
✅ **Independiente por navegador**: Funciona en cada cliente sin sincronización

---

## 📁 Archivos Creados

### 1. Sistema de Publicidad (Núcleo)
- **`src/lib/adPlayer.ts`** - Motor de publicidad simple e independiente
- **`src/components/AdPlayerComponent.tsx`** - Componente React con interfaz

### 2. Configuración
- **`public/audio/ads/ads-config.json`** - Configuración de anuncios
- **`public/audio/ads/README.md`** - Guía para agregar archivos de audio

### 3. Documentación
- **`INTEGRACION_PUBLICIDAD_SIMPLE.md`** - Este archivo

---

## 🎯 Cómo Funciona

### Flujo de Reproducción

```
1. Usuario pulsa PLAY
   ↓
2. Se reproduce ad_start.mp3 (15s)
   ↓
3. Comienza la música (canción 1)
   ↓
4. Suena la música durante 10 segundos (acumulado)
   ↓
5. Al terminar la canción actual:
   - Se reproduce ad_1.mp3 (10s)
   - Continúa con canción 2
   ↓
6. Suena la música durante 10 segundos (acumulado)
   ↓
7. Al terminar la canción actual:
   - Se reproduce ad_2.mp3 (10s)
   - Continúa con canción 3
   ↓
8. ... (repite el ciclo)
   ↓
9. Al terminar la última canción:
   - Se reproduce ad_end.mp3 (15s)
   - Fin de la sesión
```

### Comportamiento de Stop

```
Usuario pulsa STOP
   ↓
Se detiene la reproducción inmediatamente
   ↓
NO se reproduce anuncio de cierre
   ↓
Estado: 'stopped'
```

---

## 🔧 Cómo Integrar en tu Aplicación

### Opción 1: Usar el Componente React (Recomendado)

```tsx
import AdPlayerComponent from './components/AdPlayerComponent';

function TuApp() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Tu cola de música (IDs de pistas de Audius)
  const musicQueue = ['track_id_1', 'track_id_2', 'track_id_3'];
  
  // Función para obtener URL de stream
  const getMusicUrl = (trackId: string) => {
    return `https://api.audius.co/v1/tracks/${trackId}/stream?app_name=TuApp`;
  };

  return (
    <div>
      {/* Tu reproductor existente */}
      <audio ref={audioRef} />
      
      {/* Componente de publicidad */}
      <AdPlayerComponent 
        audioRef={audioRef}
        musicQueue={musicQueue}
        getMusicUrl={getMusicUrl}
      />
    </div>
  );
}
```

### Opción 2: Usar el Motor Directamente

```tsx
import { adPlayer } from './lib/adPlayer';

// En tu componente
useEffect(() => {
  if (audioRef.current) {
    adPlayer.initialize(
      audioRef.current,
      getMusicUrl,
      {
        onAdStart: (ad) => console.log('Anuncio iniciado:', ad.name),
        onAdEnd: (ad) => console.log('Anuncio terminado:', ad.name),
        onMusicStart: () => console.log('Música iniciada'),
        onMusicEnd: () => console.log('Música terminada'),
        onStateChange: (state) => console.log('Estado:', state),
      }
    );
    
    adPlayer.loadMusicQueue(['track_1', 'track_2', 'track_3']);
  }
  
  return () => adPlayer.destroy();
}, []);

// Controles
const handlePlay = () => adPlayer.play();
const handlePause = () => adPlayer.pause();
const handleResume = () => adPlayer.resume();
const handleStop = () => adPlayer.stop();
```

---

## 🎵 Agregar Archivos de Audio

### Paso 1: Crear los archivos MP3

Crea los siguientes archivos en `public/audio/ads/`:

```
public/audio/ads/
├── ad_start.mp3      ← 15 segundos (bienvenida)
├── ad_1.mp3           ← 10 segundos (intermedio 1)
├── ad_2.mp3           ← 10 segundos (intermedio 2)
├── ad_3.mp3           ← 10 segundos (intermedio 3)
└── ad_end.mp3         ← 15 segundos (cierre)
```

### Paso 2: Contenido sugerido

**ad_start.mp3** (15s):
```
"Bienvenido a Radio El Hombre de las Nubes. La emisora autónoma con el catálogo completo del Profesor Manuel Gago Fernández. Disfruta de la música."
```

**ad_1.mp3, ad_2.mp3, ad_3.mp3** (10s cada uno):
```
"Estás escuchando El Hombre de las Nubes. Música del Profesor Manuel Gago Fernández en Audius."
```

**ad_end.mp3** (15s):
```
"Gracias por escuchar Radio El Hombre de las Nubes. Has estado escuchando el catálogo completo del Profesor Manuel Gago Fernández. Hasta pronto."
```

### Paso 3: Verificar configuración

El archivo `public/audio/ads/ads-config.json` ya está configurado correctamente. Solo asegúrate de que los nombres de archivo coincidan.

---

## 🧪 Probar el Sistema

### Prueba 1: Publicidad al Inicio
1. Abre la aplicación
2. Pulsa **Play**
3. ✅ Debe reproducirse `ad_start.mp3` primero
4. ✅ Luego debe comenzar la música

### Prueba 2: Publicidad Cada 10 Segundos
1. Deja que la música suene
2. Espera 10 segundos de tiempo acumulado
3. ✅ Al terminar la canción actual, debe reproducirse un anuncio
4. ✅ Luego debe continuar con la siguiente canción
5. ✅ El contador de tiempo acumulado debe resetearse a 0

### Prueba 3: Publicidad al Final
1. Deja que suenen todas las canciones de la cola
2. ✅ Al terminar la última canción, debe reproducirse `ad_end.mp3`
3. ✅ Luego debe detenerse automáticamente

### Prueba 4: Stop sin Anuncio
1. Mientras suena música o un anuncio, pulsa **Stop**
2. ✅ Debe detenerse inmediatamente
3. ✅ NO debe reproducir anuncio de cierre

### Prueba 5: Pausa y Reanudación
1. Pulsa **Pausar** mientras suena música
2. ✅ Debe pausarse
3. Pulsa **Reanudar**
4. ✅ Debe continuar desde donde se pausó
5. ✅ El tiempo acumulado debe mantenerse

---

## ⚙️ Configuración Avanzada

### Cambiar el intervalo de anuncios

Edita `public/audio/ads/ads-config.json`:

```json
{
  "config": {
    "adIntervalSeconds": 15  // Cambiar a 15, 20, 30 segundos, etc.
  }
}
```

### Agregar más anuncios intermedios

Edita `public/audio/ads/ads-config.json`:

```json
{
  "ads": {
    "middle": [
      { "id": "ad_1", "file": "/audio/ads/ad_1.mp3", "duration": 10 },
      { "id": "ad_2", "file": "/audio/ads/ad_2.mp3", "duration": 10 },
      { "id": "ad_3", "file": "/audio/ads/ad_3.mp3", "duration": 10 },
      { "id": "ad_4", "file": "/audio/ads/ad_4.mp3", "duration": 10 },
      { "id": "ad_5", "file": "/audio/ads/ad_5.mp3", "duration": 10 }
    ]
  }
}
```

Los anuncios se rotarán automáticamente: ad_1 → ad_2 → ad_3 → ad_4 → ad_5 → ad_1 → ...

---

## 🐛 Solución de Problemas

### Los anuncios no se reproducen
1. Verifica que los archivos MP3 existen en `public/audio/ads/`
2. Revisa la consola del navegador para errores
3. Asegúrate de que los nombres de archivo coinciden con `ads-config.json`

### La música no continúa después del anuncio
1. Verifica que `getMusicUrl` devuelve URLs válidas
2. Revisa la consola para errores de red
3. Asegúrate de que las pistas de Audius son accesibles

### El tiempo acumulado no se resetea
1. Este es el comportamiento correcto: solo se resetea cuando se reproduce un anuncio
2. Si quieres cambiar el intervalo, edita `adIntervalSeconds` en la configuración

### Se reproducen múltiples anuncios a la vez
1. Esto NO debería ocurrir con el sistema actual
2. Si ocurre, revisa que no estés llamando `play()` múltiples veces
3. El sistema tiene protección anti-acumulación

---

## 📊 Diferencias con el Sistema Anterior

| Característica | Sistema Anterior | Sistema Nuevo |
|----------------|------------------|---------------|
| Complejidad | Alta (múltiples módulos) | **Baja (1 módulo simple)** |
| TTS vs Audio | Usaba TTS | **Usa archivos MP3** |
| Integración | Compleja con Zustand | **Independiente** |
| Configuración | Múltiples archivos | **1 archivo JSON** |
| Mantenimiento | Difícil | **Fácil** |
| Dependencias | Muchas | **Ninguna** |

---

## 🎯 Resumen

✅ Sistema de publicidad **simple e independiente** creado  
✅ Cumple **exactamente** con tus 4 requisitos  
✅ **No modifica** funcionalidades existentes  
✅ **Fácil de integrar** en tu aplicación  
✅ **Fácil de mantener** y configurar  
✅ **Documentación completa** incluida  

### Próximos Pasos

1. **Agrega los archivos MP3** en `public/audio/ads/`
2. **Integra el componente** en tu aplicación
3. **Prueba el sistema** siguiendo la guía de pruebas
4. **Ajusta la configuración** según tus necesidades

---

**Sistema de Publicidad Simple** - Listo para usar 🎉
