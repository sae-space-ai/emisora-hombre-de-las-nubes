# ☁️ Radio El Hombre de las Nubes

> **Emisora de radio digital autónoma 24/7** con el catálogo completo del Prof. Manuel Gago Fernández (@profmanuelgago en Audius)

![Estado](https://img.shields.io/badge/estado-en%20vivo-green)
![Audius](https://img.shields.io/badge/powered%20by-Audius-purple)
![24/7](https://img.shields.io/badge/transmisión-24%2F7%20autónoma-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

---

## 🎯 Objetivo

Plataforma web que ingesta, cataloga, programa y reproduce de forma **ininterrumpida** el catálogo musical completo del Prof. Manuel Gago Fernández. Resiliente, auto-programable, con locuciones sintéticas (TTS) y despliegue sin intervención humana.

## 🏗️ Arquitectura del Ecosistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMISORA EL HOMBRE DE LAS NUBES                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  AUDIUS  │──▶│ INGESTA  │──▶│CATÁLOGO  │──▶│ SCHEDULER│    │
│  │   API    │   │  (FASE2) │   │  JSON    │   │  (FASE3) │    │
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘    │
│                                                      │          │
│                                                      ▼          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │   TTS    │◀──│  PLAYER  │◀──│  QUEUE   │◀──│   ZUSTAND│    │
│  │  (FASE4) │   │  ENGINE  │   │ QueueItem│   │  STORE   │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │                                         │
│       │              ▼                                         │
│       │        ┌──────────┐                                    │
│       └───────▶│  LOGGER  │  FASE 7: Logs con timestamp       │
│                │ + CRON   │  + Actualización automática        │
│                └──────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Fases del Protocolo Maestro

### FASE 1: Inicialización ✅
- [x] Proyecto Vite + React + TypeScript (Strict Mode)
- [x] Tailwind CSS v4
- [x] Zustand para estado global
- [x] Estructura de carpetas modular

### FASE 2: Ingesta y Catalogación ✅
- [x] `src/lib/audius.ts` - SDK de Audius con paginación automática
- [x] `fetchAllArtistTracks()` - Obtiene TODAS las pistas con `while` loop
- [x] Clasificación automática por álbum y categoría
- [x] Persistencia en localStorage (fallback de Vercel KV)

### FASE 3: Programación Autónoma ✅
- [x] `src/lib/scheduler.ts` - Motor de programación semanal
- [x] Parrilla basada en álbumes específicos del catálogo
- [x] `generateQueue()` con **TTS markers cada 3 pistas**
- [x] Patrón: `[Track, Track, Track, TTS, Track, Track, Track, TTS, ...]`
- [x] Fisher-Yates shuffle para evitar repeticiones

### FASE 4: Motor de Reproducción 24/7 ✅
- [x] `src/store/useRadioStore.ts` - Estado global con QueueItem
- [x] Elemento `<audio>` controlado con `onEnded` → avance automático
- [x] **Timeout de seguridad de 10 segundos** para pistas que no cargan
- [x] Manejo de errores: skip automático sin detener la emisora
- [x] TTS con `SpeechSynthesisUtterance` + callback `onend`
- [x] Regeneración automática de cola al vaciarse

### FASE 5: Interfaz de Usuario ✅
- [x] `StationHeader.tsx` - Indicador EN VIVO pulsante
- [x] `NowPlaying.tsx` - Carátula, metadata, barra de progreso
- [x] `RadioPlayer.tsx` - Play/Pause, Skip, Volumen
- [x] `PlaylistQueue.tsx` - Cola scrolleable con TTS markers visibles
- [x] `ScheduleDisplay.tsx` - Parrilla del día actual
- [x] `Visualizer.tsx` - Barras animadas CSS

### FASE 6: Despliegue ✅
- [x] Compatible con Vercel (build estático)
- [x] Compatible con Netlify, GitHub Pages, cualquier hosting
- [x] SEO optimizado con meta tags

### FASE 7: Mantenimiento y Auto-Evolución ✅
- [x] `src/lib/cron.ts` - Endpoint de actualización del catálogo
- [x] `src/lib/logger.ts` - Sistema de logs con timestamp
- [x] Persistencia de playedIds para evitar repeticiones entre sesiones
- [x] Actualización en background si detecta nuevas pistas

## 📻 Programación Semanal por Álbumes

| Día | Álbumes |
|-----|---------|
| **Lunes** | Marchas de Procesión Vol. IX + Sacred Echoes + UTRERA PASIÓN Y GLORIA |
| **Martes** | Coplas de Sombra y Sangre + Coplas Entre cadenas y rosas + Saetas del Alma |
| **Miércoles** | Black Petals Fall + LUDWIG XXI + Bulerías del Silencio |
| **Jueves** | Spiritual Trap + La voz del tiempo (Audiolibros) |
| **Viernes** | Suite Andalucía + Guitarra + Romancero del Toque Vivido Vol. II |
| **Sábado** | Opera L'Ombra della Musica + PAN — EL MUSICAL |
| **Domingo** | Fandangos, Alegrías, Siguiriyas... + Selección aleatoria |

## 🚀 Instalación y Despliegue

### Requisitos
- Node.js 18+
- npm o yarn

### Local
```bash
git clone <repo-url>
cd emisora-hombre-de-las-nubes
npm install
npm run dev
```

### Build
```bash
npm run build
# Archivos en dist/
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Variables de Entorno
```env
# Opcional - para lecturas públicas no se requiere
AUDIUS_API_KEY=tu_api_key_de_audius
```

## 📁 Estructura de Archivos

```
src/
├── lib/
│   ├── audius.ts          # FASE 2: Ingesta con paginación
│   ├── scheduler.ts       # FASE 3: Programación + TTS markers
│   ├── tts.ts             # FASE 4: Web Speech API
│   ├── logger.ts          # FASE 7: Logs con timestamp
│   ├── persistence.ts     # FASE 2.4: Caché localStorage
│   └── cron.ts            # FASE 7: Actualización automática
├── store/
│   └── useRadioStore.ts   # FASE 4: Estado global Zustand
├── components/
│   ├── StationHeader.tsx  # FASE 5: Header + EN VIVO
│   ├── RadioPlayer.tsx    # FASE 4: Motor de reproducción
│   ├── NowPlaying.tsx     # FASE 5: Info pista actual
│   ├── Visualizer.tsx     # FASE 5: Ecualizador animado
│   ├── ScheduleDisplay.tsx # FASE 5: Parrilla
│   └── PlaylistQueue.tsx  # FASE 5: Cola con TTS markers
├── App.tsx                # FASE 4-6: Integración completa
├── main.tsx               # Entry point
└── index.css              # Tailwind + custom styles
```

## 🔑 Lógica Crítica del Motor

### Flujo de Reproducción
```
1. Usuario pulsa "Iniciar Emisora"
   ↓
2. TTS de bienvenida → speak(getWelcomeMessage())
   ↓
3. generateQueue() → [Track, Track, Track, TTS, Track, ...]
   ↓
4. Reproducir Track 1 → <audio>.play()
   ↓
5. onEnded → advanceToNext()
   ↓
6. ¿Siguiente es TTS? → speak(message) → onend → advanceToNext()
   ¿Siguiente es Track? → <audio>.play()
   ↓
7. ¿Cola vacía? → regenerateQueue() → volver a paso 4
```

### Timeout de Seguridad (FASE 4.3)
```javascript
// Si una pista no carga en 10 segundos, se salta automáticamente
setTimeout(() => {
  if (audio.readyState < 2) {
    logError('Timeout de stream (10s). Saltando pista.');
    audio.pause();
    handleAdvance();
  }
}, 10000);
```

### TTS cada 3 Pistas (FASE 3.3)
```javascript
// Patrón de cola generado:
[Track1, Track2, Track3, TTS_1, Track4, Track5, Track6, TTS_2, ...]
```

## 🎤 Locuciones TTS

La emisora genera locuciones automáticas:
- **Bienvenida**: Al iniciar
- **Transición**: Entre pistas cada 3 canciones
- **Identificación**: Cada 5 pistas ("Estás escuchando El Hombre de las Nubes...")
- **Cambio de bloque**: Al cambiar la programación horaria

## 📊 Sistema de Logs

```javascript
// Todos los eventos se registran con timestamp ISO
[2025-01-15T10:30:45.123Z] [TRACK] Reproduciendo: "Marcha de la Esperenza"
[2025-01-15T10:35:12.456Z] [TTS] Locución: "Continuamos con más música..."
[2025-01-15T10:40:00.789Z] [QUEUE] Cola regenerada: 47 items
[2025-01-15T10:42:33.012Z] [ERROR] Timeout de stream (10s). Saltando pista.
```

## 🔒 Consideraciones

- **Derechos de autor**: Uso personal/educativo/promocional del artista
- **Audius ToS**: Se respeta la licencia del contenido en Audius
- **Rate limits**: 10 req/s, pausas de 120ms entre requests
- **Autoplay**: Requiere interacción del usuario (botón "Iniciar Emisora")

## 📡 API de Audius

- **Base URL**: `https://api.audius.co/v1`
- **Artista**: `@profmanuelgago`
- **Límites**: 10 req/s, 500,000 req/mes (sin API key)
- **Streaming**: URLs directas por pista

---

*Radio El Hombre de las Nubes — Transmitiendo las nubes sonoras del Prof. Manuel Gago Fernández las 24 horas del día, los 7 días de la semana. Emisora 100% autónoma.*
