# ☁️ Radio El Hombre de las Nubes

**Emisora de radio digital autónoma 24/7** con el catálogo completo del Prof. Manuel Gago Fernández, transmitiendo desde Audius.

![Estado](https://img.shields.io/badge/estado-en%20vivo-green)
![Audius](https://img.shields.io/badge/powered%20by-Audius-purple)
![24/7](https://img.shields.io/badge/transmisión-24%2F7-blue)

## 🎵 Características

- **Reproducción autónoma 24/7**: La emisora funciona sin intervención humana
- **Programación temática automática**: Bloques horarios basados en el día de la semana
- **Catálogo completo**: +500 pistas del Prof. Manuel Gago Fernández desde Audius
- **Locuciones TTS**: Identificaciones de voz automáticas entre pistas
- **Motor de programación inteligente**: Clasificación automática por género (flamenco, copla, marchas, sinfónica, electrónica, trap espiritual, etc.)
- **Interfaz responsive**: Diseño adaptativo con visualizador animado
- **Sin repeticiones**: Algoritmo que evita repetir pistas hasta agotar el catálogo

## 📻 Programación Semanal

| Día | Mañana | Mediodía | Tarde | Noche |
|-----|--------|----------|-------|-------|
| Lunes | Marchas | Copla | Sinfónica | Electrónica |
| Martes | Flamenco | Copla | Trap | Variado |
| Miércoles | Sinfónica | Flamenco | Guitarra | Copla |
| Jueves | Marchas | Electrónica | Trap | Poesía |
| Viernes | Flamenco | Copla | Sinfónica | Fiesta |
| Sábado | Guitarra | Variado | Marchas | Poesía |
| Domingo | Sacro | Copla | Flamenco | Poesía |

## 🛠️ Stack Tecnológico

- **Framework**: React + Vite + TypeScript
- **Estilos**: Tailwind CSS v4
- **Estado**: Zustand
- **API de Música**: Audius API (https://audius.co)
- **Voz**: Web Speech API (SpeechSynthesis)
- **Despliegue**: Vercel / Netlify / Cualquier hosting estático

## 🚀 Instalación y Despliegue

### Requisitos previos

- Node.js 18+ 
- npm o yarn

### Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/emisora-hombre-de-las-nubes.git
cd emisora-hombre-de-las-nubes

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

### Despliegue en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente el proyecto Vite
3. Configura las variables de entorno (si son necesarias)
4. ¡Despliega con un clic!

```bash
# Opcionalmente, usa la CLI de Vercel
npm install -g vercel
vercel
```

### Despliegue en Netlify

```bash
npm run build
# Sube la carpeta dist/ a Netlify
```

O conecta directamente tu repositorio en el dashboard de Netlify.

## 📁 Estructura del Proyecto

```
├── src/
│   ├── lib/
│   │   ├── audius.ts          # Servicio de Audius API con paginación
│   │   ├── scheduler.ts       # Motor de programación semanal
│   │   └── tts.ts             # Servicio de locuciones (Web Speech API)
│   ├── store/
│   │   └── useRadioStore.ts   # Estado global con Zustand
│   ├── components/
│   │   ├── StationHeader.tsx  # Cabecera con indicador EN VIVO
│   │   ├── RadioPlayer.tsx    # Reproductor principal
│   │   ├── NowPlaying.tsx     # Info de pista actual
│   │   ├── Visualizer.tsx     # Ecualizador animado
│   │   ├── ScheduleDisplay.tsx # Parrilla de programación
│   │   └── PlaylistQueue.tsx  # Cola de reproducción
│   ├── App.tsx                # Componente principal
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globales
├── index.html                 # HTML base con SEO
├── package.json
├── vite.config.js
├── tsconfig.json
└── README.md
```

## 🔑 Lógica del Motor de Radio

1. **Carga inicial**: Se obtienen todas las pistas del perfil `@profmanuelgago` en Audius con paginación automática
2. **Clasificación**: Cada pista se clasifica en categorías (marchas, copla, flamenco, etc.) según su metadata
3. **Programación**: El scheduler determina el bloque actual según día y hora
4. **Cola inteligente**: Se genera una cola filtrada por las categorías del bloque, evitando repeticiones
5. **Autoplay**: Al terminar una pista, se reproduce una locución TTS y se carga la siguiente automáticamente
6. **Rotación de bloques**: Cada hora, se evalúa si hay cambio de bloque y se regenera la cola
7. **Persistencia**: El estado se mantiene en el store de Zustand durante la sesión

## 🎤 Locuciones TTS

La emisora genera locuciones automáticas usando la Web Speech API del navegador:

- **Bienvenida**: Al iniciar la emisora
- **Transiciones**: Entre pistas ("Ahora suena...")
- **Identificación**: Cada 5 pistas ("Estás escuchando El Hombre de las Nubes")
- **Cambio de bloque**: Al cambiar la programación horaria

## 📡 API de Audius

La emisora utiliza la API pública de Audius:
- **Base URL**: `https://api.audius.co/v1`
- **Perfil**: `@profmanuelgago`
- **Límites**: 10 req/s, 500,000 req/mes (sin API key para lecturas públicas)
- **Streaming**: URLs de stream directas para cada pista

## 🎨 Personalización

### Modificar la programación

Edita `src/lib/scheduler.ts` para cambiar los bloques semanales:

```typescript
const WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    day: 'Lunes',
    dayIndex: 1,
    blocks: [
      { 
        name: 'Tu Bloque', 
        categories: ['flamenco', 'guitarra'], 
        startHour: 6, 
        endHour: 12,
        ttsIntro: 'Texto que se dirá al iniciar este bloque',
        // ...
      },
    ],
  },
];
```

### Cambiar las locuciones

Edita `src/lib/tts.ts` para personalizar los textos de las locuciones.

## 📝 Licencia

Este proyecto reproduce contenido del Prof. Manuel Gago Fernández disponible públicamente en Audius bajo su licencia correspondiente.

## 🙏 Créditos

- **Música**: Prof. Manuel Gago Fernández (@profmanuelgago en Audius)
- **Plataforma**: [Audius](https://audius.co) - Protocolo de audio descentralizado
- **Desarrollo**: Emisora autónoma con React + TypeScript + Zustand

---

*Radio El Hombre de las Nubes — Transmitiendo las nubes sonoras del Prof. Manuel Gago Fernández las 24 horas del día, los 7 días de la semana.*
