# 📢 Sistema de Publicidad Local Dinámica - Documentación Completa

Sistema avanzado de publicidad autónomo que inserta anuncios de comercios reales de Almendralejo en tres momentos estratégicos de la reproducción musical.

## 🎯 Características Principales

### Momentos de Inserción
1. **Al inicio de cada pista** - Anuncio antes de que comience la música
2. **Cada 15 segundos** - Anuncios durante la reproducción (configurable: 10-60s)
3. **Al final de cada pista** - Anuncio antes de pasar a la siguiente

### Tecnologías Utilizadas
- **Web Audio API** - Audio ducking profesional con fade in/out
- **Web Speech API** - Text-to-Speech en español
- **Zustand** - Estado global reactivo
- **TypeScript** - Tipado estricto

## 🏪 Anunciantes Integrados (14 comercios)

### Categoría 99: Textil, Moda y Accesorios

| Negocio | Dirección | Desde | Especialidad |
|---------|-----------|-------|--------------|
| **Almacenes Casa Ángel** | Calle Cantones, 15 | 1962 | Disfraces, mercería, fiesta |
| **Ana Blanca Bote** | Arco San Antonio, 13 | - | Moda, zapatos, complementos |
| **Arias Moda** | Calle Real, 2 | 1924 | Ceremonias, novios |
| **Bonita Locura** | Calle Pilar, 23 | - | Moda original mujer/hombre |
| **Boutique Cachemir** | Calle Cervantes, 7 | - | Moda exclusiva ocasiones especiales |
| **Boutique Guillermo Rangel** | Calle Jacinto Benavente, 9 | - | Novias, novios, madrinas |
| **Boutique Zetta** | Calle Cervantes, 10 | 1990 | Moda femenina actual |
| **Calzados Emilio Salamanca** | Calle Francisco Pizarro, 24 | 1968 | Calzado artesanal |
| **Celopman** | Calle Francisco Pizarro, 38 | - | Moda masculina |
| **Centro Comercial El Zamorano** | Calle Mártires, 9 | 1907 | Centro comercial histórico |
| **Chambra** | Calle Méndez Núñez, 1 | 1989 | Moda hombre, ceremonias |
| **Colores de Venecia** | Calle Jacinto Benavente | - | Moda con estilo |
| **Confecciones Alcalá** | Calle Francisco Pizarro, 33 | - | Moda toda la familia |
| **Decor-Textil** | Calle Santa Marta, 38 | - | Textiles para el hogar |

## 🔧 Arquitectura del Sistema

### FASE 1: Audio Mixer (`src/lib/audioMixer.ts`)
```typescript
// Web Audio API con nodos de ganancia
- musicGain: Controla volumen de música
- masterGain: Controla volumen maestro
- duckMusic(): Baja volumen música a 20% con fade suave
- restoreMusic(): Restaura volumen original
```

### FASE 2: Ad Generator (`src/lib/adGenerator.ts`)
```typescript
// Web Speech API para TTS
- speakAd(): Genera y reproduce anuncio con TTS
- Voz: es-ES-Standard-A (español de España)
- Velocidad: 1.0 (normal)
- Tono: 1.0 (natural)
```

### FASE 3: Ad Scheduler (`src/lib/adScheduler.ts`)
```typescript
// Programación inteligente de anuncios
- getNextAd(): Rotación sin repeticiones
- shouldPlayAdDuringTrack(): Verifica cada 15s
- shouldPlayAdAtStart(): Anuncio al inicio
- shouldPlayAdAtEnd(): Anuncio al final
- resetForNewTrack(): Resetea temporizador
```

### FASE 4: Base de Datos
- `src/data/advertisers.json` - 14 anunciantes reales
- `src/data/adConfig.json` - Configuración del sistema

### FASE 5: Integración (`src/components/RadioPlayer.tsx`)
```typescript
// useEffect hooks para:
1. Inicializar Audio Mixer al cargar
2. Anuncio al inicio de pista
3. Anuncios cada 15s durante reproducción
4. Anuncio al final de pista
5. Reset de temporizador en nueva pista
```

## 🎛️ Panel de Administración

Accesible desde el botón de engranaje (⚙️) en la esquina inferior derecha.

### Funcionalidades
- ✅ Activar/desactivar anunciantes individuales
- ✅ Configurar intervalo entre anuncios (10-60 segundos)
- ✅ Habilitar/deshabilitar anuncios al inicio de pista
- ✅ Habilitar/deshabilitar anuncios al final de pista
- ✅ Ver estadísticas en tiempo real
- ✅ Ver lista completa de anunciantes

## 🎨 Visualización

### Banner de Publicidad
Cuando se reproduce un anuncio, aparece un banner animado con:
- Badge "PUBLICIDAD" destacado
- Nombre del negocio
- Dirección completa
- Icono de verificación
- Animación de ondas de audio

### Audio Ducking
- **Fade out**: 0.5 segundos (música baja a 20%)
- **Anuncio**: Se reproduce a volumen completo
- **Fade in**: 0.5 segundos (música vuelve a 100%)

## 📊 Configuración

### Archivo `src/data/adConfig.json`
```json
{
  "adIntervalSeconds": 15,
  "adMinDurationSeconds": 10,
  "adMaxDurationSeconds": 30,
  "enableDucking": true,
  "duckingLevel": 0.2,
  "duckingFadeSeconds": 0.5,
  "playAdAtStart": true,
  "playAdAtEnd": true,
  "enableAds": true,
  "maxAdsPerTrack": 10
}
```

### Parámetros Configurable
- **`adIntervalSeconds`**: Intervalo entre anuncios durante la pista (10-60s)
- **`duckingLevel`**: Volumen de música durante anuncio (0.2 = 20%)
- **`duckingFadeSeconds`**: Duración del fade in/out (0.5s)
- **`playAdAtStart`**: Anuncio al inicio de cada pista
- **`playAdAtEnd`**: Anuncio al final de cada pista
- **`maxAdsPerTrack`**: Máximo de anuncios por pista

## 🔄 Rotación Inteligente

### Algoritmo
1. Mantiene historial de últimos 5 anuncios reproducidos
2. Filtra anunciantes que no estén en el historial
3. Selecciona aleatoriamente del pool disponible
4. Si todos están en historial, resetea y repite

### Beneficios
- ✅ Evita repeticiones consecutivas
- ✅ Distribución equitativa entre anunciantes
- ✅ Variedad en la experiencia del usuario

## 💼 Modelo de Negocio

### Precios Sugeridos
- **Anuncio de 10s**: 50€/mes
- **Anuncio de 12s**: 60€/mes
- **Anuncio de 15s**: 75€/mes

### Cálculo de Exposición
Con 14 anunciantes y emisiones 24/7:
- **Anuncios por hora**: ~240 (cada 15s)
- **Anuncios por día**: ~5,760
- **Anuncios por mes**: ~172,800
- **Exposición por anunciante**: ~12,343 reproducciones/mes

### Ingresos Potenciales
- **14 anunciantes × 75€/mes** = 1,050€/mes
- **Costes operativos**: ~100€/mes (hosting, API)
- **Beneficio neto**: ~950€/mes

## 📝 Cómo Añadir Nuevos Anunciantes

Consulta la guía completa en [`HOW_TO_ADD_ADVERTISERS.md`](HOW_TO_ADD_ADVERTISERS.md)

### Resumen Rápido
1. Edita `src/data/advertisers.json`
2. Añade nuevo objeto con estructura JSON
3. Guarda y recarga la emisora
4. Verifica en panel de administración

## 🔊 Audio Ducking Profesional

### Implementación Técnica
```typescript
// Web Audio API con GainNode
const audioContext = new AudioContext();
const musicGain = audioContext.createGain();
const masterGain = audioContext.createGain();

// Conectar: musicSource → musicGain → masterGain → destination
musicSource.connect(musicGain);
musicGain.connect(masterGain);
masterGain.connect(audioContext.destination);

// Ducking suave con linearRampToValueAtTime
musicGain.gain.linearRampToValueAtTime(0.2, currentTime + 0.5);
```

### Ventajas
- ✅ Transiciones suaves sin cortes bruscos
- ✅ Calidad de audio profesional
- ✅ Compatible con todos los navegadores modernos

## 🎙️ Text-to-Speech (TTS)

### Configuración
- **API**: Web Speech API (SpeechSynthesis)
- **Idioma**: es-ES (español de España)
- **Voz**: es-ES-Standard-A (femenina)
- **Velocidad**: 1.0 (normal)
- **Tono**: 1.0 (natural)
- **Volumen**: 1.0 (máximo)

### Ventajas
- ✅ Sin costes de producción de audio
- ✅ Fácil de actualizar scripts
- ✅ Voz natural y profesional
- ✅ Compatible con todos los navegadores

## 📈 Estadísticas y Analytics

### Métricas Registradas
- Total de anunciantes activos
- Anuncios reproducidos por pista
- Historial de rotación
- Tiempo entre anuncios
- Duración de cada anuncio

### Acceso
- **Panel de administración**: Interfaz visual
- **Consola del navegador**: Logs detallados
- **Zustand store**: Estado global reactivo

## ⚙️ Configuración Avanzada

### Cambiar Intervalo de Anuncios
```typescript
// En panel de administración o programáticamente
adScheduler.setAdInterval(20); // 20 segundos
```

### Desactivar Anuncios al Inicio/Final
```typescript
// Editar src/data/adConfig.json
{
  "playAdAtStart": false,
  "playAdAtEnd": false
}
```

### Ajustar Nivel de Ducking
```typescript
// Editar src/data/adConfig.json
{
  "duckingLevel": 0.3  // 30% de volumen de música
}
```

## 🐛 Troubleshooting

### El anuncio no se reproduce
1. Verifica que `adsEnabled` sea `true`
2. Comprueba que el anunciante esté habilitado
3. Revisa la consola del navegador para errores
4. Asegúrate de que el navegador soporta Web Speech API

### El audio ducking no funciona
1. Verifica que el navegador soporta Web Audio API
2. Comprueba que `enableDucking` sea `true`
3. Revisa que el AudioContext se inicializó correctamente

### El TTS suena raro
1. Verifica que hay voces en español disponibles
2. Prueba con diferentes voces (es-ES-Standard-B)
3. Ajusta `rate` y `pitch` en `adGenerator.ts`

## 🔒 Consideraciones Legales

### Aviso Legal
> "La publicidad emitida es de empresas reales de Almendralejo. Si eres titular de un negocio y quieres aparecer, contacta con nosotros. Todos los datos son públicos y se utilizan con fines promocionales."

### Buenas Prácticas
- ✅ Obtener consentimiento de los anunciantes
- ✅ Verificar precisión de la información
- ✅ Respetar privacidad (solo datos comerciales públicos)
- ✅ Scripts verídicos y no engañosos

## 🚀 Próximas Mejoras

### Roadmap
- [ ] Audio files pregrabados en lugar de TTS
- [ ] Programación horaria de anuncios (hora punta)
- [ ] Analytics detallados con gráficos
- [ ] A/B testing de scripts
- [ ] Integración con Google Ads
- [ ] Sistema de facturación automático
- [ ] API REST para gestión remota
- [ ] App móvil para anunciantes

## 📞 Contacto para Anunciantes

Para agregar tu negocio a la emisora:

1. Prepara tu script publicitario (10-15 segundos)
2. Proporciona: nombre, dirección, teléfono, descripción
3. Opcional: logo, imagen, audio grabado
4. Contacta: [tu-email@ejemplo.com]

## 🎉 Conclusión

El sistema de publicidad local dinámica de "El Hombre de las Nubes" representa una solución innovadora para monetizar la emisora mientras se apoya el comercio local de Almendralejo. Con tecnología de vanguardia (Web Audio API, Web Speech API) y un diseño centrado en el usuario, ofrece una experiencia publicitaria no intrusiva y profesional.

---

**Sistema de Publicidad Local Dinámica** - Potenciando el comercio de Almendralejo 🏪🎵

*Documentación actualizada: Enero 2025*
