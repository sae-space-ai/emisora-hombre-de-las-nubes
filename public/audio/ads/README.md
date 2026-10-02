# 📢 Sistema de Publicidad - Archivos de Audio

## Archivos Necesarios

Coloca los siguientes archivos MP3 en la carpeta `public/audio/ads/`:

### 1. Publicidad de Bienvenida (al inicio)
- **Archivo**: `ad_start.mp3`
- **Duración recomendada**: 15 segundos
- **Cuándo se reproduce**: Al pulsar Play, antes de la primera canción

### 2. Publicidad Intermedia (cada 10 segundos de música)
- **Archivos**: `ad_1.mp3`, `ad_2.mp3`, `ad_3.mp3`
- **Duración recomendada**: 10 segundos cada uno
- **Cuándo se reproducen**: Cada 10 segundos de música acumulada, esperando al final de la canción actual
- **Rotación**: Se alternan automáticamente (ad_1 → ad_2 → ad_3 → ad_1 → ...)

### 3. Publicidad de Cierre (al final)
- **Archivo**: `ad_end.mp3`
- **Duración recomendada**: 15 segundos
- **Cuándo se reproduce**: Al terminar la lista de canciones (no se reproduce si el usuario pulsa Stop)

## Estructura de Carpetas

```
public/
└── audio/
    └── ads/
        ├── ad_start.mp3      ← Publicidad de bienvenida
        ├── ad_1.mp3           ← Publicidad intermedia 1
        ├── ad_2.mp3           ← Publicidad intermedia 2
        ├── ad_3.mp3           ← Publicidad intermedia 3
        ├── ad_end.mp3         ← Publicidad de cierre
        └── ads-config.json    ← Configuración (ya creado)
```

## Configuración

El archivo `ads-config.json` ya está configurado con:

```json
{
  "ads": {
    "start": {
      "id": "ad_start",
      "name": "Publicidad de Bienvenida",
      "file": "/audio/ads/ad_start.mp3",
      "duration": 15
    },
    "middle": [
      {
        "id": "ad_1",
        "name": "Anuncio 1",
        "file": "/audio/ads/ad_1.mp3",
        "duration": 10
      },
      {
        "id": "ad_2",
        "name": "Anuncio 2",
        "file": "/audio/ads/ad_2.mp3",
        "duration": 10
      },
      {
        "id": "ad_3",
        "name": "Anuncio 3",
        "file": "/audio/ads/ad_3.mp3",
        "duration": 10
      }
    ],
    "end": {
      "id": "ad_end",
      "name": "Publicidad de Cierre",
      "file": "/audio/ads/ad_end.mp3",
      "duration": 15
    }
  },
  "config": {
    "adIntervalSeconds": 10,
    "waitForSongEnd": true
  }
}
```

### Cambiar el intervalo de anuncios

Para cambiar la frecuencia de anuncios intermedios, edita `adIntervalSeconds`:

```json
{
  "config": {
    "adIntervalSeconds": 15  // Cambiar a 15 segundos, 20 segundos, etc.
  }
}
```

### Agregar más anuncios intermedios

Para agregar más anuncios, añade más objetos al array `middle`:

```json
{
  "middle": [
    { "id": "ad_1", "name": "Anuncio 1", "file": "/audio/ads/ad_1.mp3", "duration": 10 },
    { "id": "ad_2", "name": "Anuncio 2", "file": "/audio/ads/ad_2.mp3", "duration": 10 },
    { "id": "ad_3", "name": "Anuncio 3", "file": "/audio/ads/ad_3.mp3", "duration": 10 },
    { "id": "ad_4", "name": "Anuncio 4", "file": "/audio/ads/ad_4.mp3", "duration": 10 }
  ]
}
```

## Especificaciones de los Archivos de Audio

- **Formato**: MP3
- **Calidad**: 128-192 kbps recomendado
- **Canales**: Mono o Stereo
- **Sample rate**: 44.1 kHz
- **Tamaño máximo recomendado**: 2 MB por archivo

## Ejemplo de Contenido Publicitario

### Publicidad de Bienvenida (ad_start.mp3)
```
"Bienvenido a Radio El Hombre de las Nubes. La emisora autónoma con el catálogo completo del Profesor Manuel Gago Fernández. Disfruta de la música."
```

### Publicidad Intermedia (ad_1.mp3, ad_2.mp3, ad_3.mp3)
```
"Estás escuchando El Hombre de las Nubes. Música del Profesor Manuel Gago Fernández en Audius."
```

```
"Radio El Hombre de las Nubes. Flamenco, copla, marchas procesionales y más. Continúa disfrutando."
```

```
"El Hombre de las Nubes. Emisora autónoma veinticuatro siete. Profesor Manuel Gago Fernández."
```

### Publicidad de Cierre (ad_end.mp3)
```
"Gracias por escuchar Radio El Hombre de las Nubes. Has estado escuchando el catálogo completo del Profesor Manuel Gago Fernández. Hasta pronto."
```

## Pruebas

1. Coloca los archivos MP3 en `public/audio/ads/`
2. Recarga la página web
3. Pulsa Play
4. Verifica que:
   - ✅ Se reproduce `ad_start.mp3` primero
   - ✅ Luego comienza la música
   - ✅ Cada 10 segundos de música, se espera al final de la canción
   - ✅ Se reproduce un anuncio intermedio
   - ✅ Continúa la siguiente canción
   - ✅ Al terminar la lista, se reproduce `ad_end.mp3`
   - ✅ Si pulsas Stop, no se reproduce anuncio de cierre

## Soporte

Si tienes problemas:
1. Verifica que los archivos MP3 existen en la ruta correcta
2. Revisa la consola del navegador para errores
3. Asegúrate de que los nombres de archivo coinciden con `ads-config.json`
4. Verifica que los archivos no están corruptos

---

**Sistema de Publicidad Simple** - Integrado en Radio El Hombre de las Nubes
