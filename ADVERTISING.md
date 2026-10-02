# 📢 Sistema de Publicidad Local Dinámica

Sistema de publicidad autónomo que inserta anuncios de empresas reales de Almendralejo cada 30 segundos de reproducción musical.

## 🎯 Características

- **15 anunciantes reales** de Almendralejo
- **Rotación inteligente** que evita repetir anuncios consecutivamente
- **Audio ducking** automático (baja el volumen de la música durante el anuncio)
- **TTS en español** para locuciones naturales
- **Intervalo configurable** (por defecto cada 30 segundos)
- **Toggle on/off** desde la interfaz
- **Visualización atractiva** con información completa del anunciante

## 🏪 Anunciantes Incluidos

### Moda y Comercio
- **Chambra Moda Hombre** - Moda masculina y ceremonias (desde 1989)
- **El Zamorano Centro Comercial** - Centro comercial histórico (desde 1909)

### Salud
- **Clínica Dental Sara Moreno** - Ortodoncia e implantes
- **Clínica Dental Barrau** - Invisalign y tecnología dental
- **Farmacia Alcántara** - Farmacia en el centro

### Alimentación y Bodegas
- **Bodegas Peña de Hita** - Vinos y derivados de la uva
- **Buenaval** - Embutidos, jamones y quesos
- **Aceitunas Barroso e Hijos** - Aceitunas y encurtidos
- **Cash Extremeño** - Distribución de alimentos

### Servicios
- **Librería San Francisco** - Libros y papelería
- **Mármoles Asuar** - Mármol y granito (desde 1946)
- **Limpia Car** - Lavado de coches
- **Lourdes Amaya Estética** - Belleza y tratamientos
- **Mansele Climatización** - Estufas de pellet y biomasa

### Deporte
- **Pádel Indoor 15/30** - Club de pádel

## 🔧 Configuración

### Intervalo entre anuncios

Edita `src/lib/ads.ts`:

```typescript
const AD_CONFIG = {
  interval: 30000, // Cambia este valor (en milisegundos)
  duckingVolume: 0.2, // Volumen de música durante anuncio (20%)
  fadeInDuration: 500, // ms para fade in/out
  enableAds: true, // Master switch
};
```

### Habilitar/Deshabilitar publicidad

Desde la interfaz:
1. Abre el panel de configuración (⚙️)
2. Activa/desactiva "Publicidad local"

O programáticamente:

```typescript
import { setAdsEnabled } from './lib/ads';

setAdsEnabled(false); // Desactivar anuncios
setAdsEnabled(true);  // Activar anuncios
```

### Agregar nuevos anunciantes

Edita `src/data/advertisers.json`:

```json
{
  "id": "mi_negocio",
  "name": "Mi Negocio",
  "category": "Categoría",
  "address": "Dirección completa",
  "phone": "924 XX XX XX",
  "website": "https://miweb.com",
  "since": "2020",
  "description": "Descripción breve del negocio",
  "adScript": "Script completo que se leerá con TTS. Incluye nombre, dirección y mensaje principal.",
  "audioFile": null,
  "ttsVoice": "es-ES-Standard-A",
  "duration": 15
}
```

## 🎨 Visualización

Durante la reproducción de un anuncio, se muestra un panel flotante con:

- ✅ Badge "PUBLICIDAD"
- 📝 Nombre del negocio
- 🏷️ Categoría
- 📍 Dirección
- 📞 Teléfono (si está disponible)
- 📅 Año de fundación (si está disponible)
- 🎵 Animación de ondas de audio

El panel tiene un diseño atractivo con gradiente ámbar/naranja que destaca sobre la interfaz.

## 🔊 Audio Ducking

El sistema implementa audio ducking profesional:

1. **Fade out** de la música (500ms) → baja al 20% del volumen
2. **Reproducción del anuncio** con TTS al 100% de volumen
3. **Fade in** de la música (500ms) → vuelve al volumen original

Esto crea una transición suave y profesional entre música y publicidad.

## 📊 Estadísticas

El sistema registra:

- Total de anunciantes disponibles
- Anuncios reproducidos en la sesión
- Timestamp del último anuncio reproducido

Accede a las estadísticas:

```typescript
import { getAdStats } from './lib/ads';

const stats = getAdStats();
console.log(stats);
// { totalAds: 15, adsPlayed: 3, lastAdTime: "2025-01-15T..." }
```

## 🎙️ Voces TTS

El sistema usa la Web Speech API del navegador con voces en español:

- **Idioma**: `es-ES` (español de España)
- **Velocidad**: 0.95 (ligeramente más lento para claridad)
- **Tono**: 1.0 (normal)
- **Volumen**: 1.0 (máximo)

El navegador selecciona automáticamente la mejor voz en español disponible.

## 🔄 Rotación Inteligente

El sistema evita repetir anuncios consecutivamente:

1. Mantiene un historial de los últimos 5 anuncios reproducidos
2. Selecciona aleatoriamente entre los anuncios no recientes
3. Si todos se han reproducido, resetea el historial
4. Garantiza que cada anunciante tenga exposición equitativa

## 💼 Modelo de Negocio

Este sistema permite:

- **Monetización** de la emisora con publicidad local
- **Apoyo** a comercios de Almendralejo
- **Integración** natural con la programación musical
- **Escalabilidad** para agregar más anunciantes

### Precios sugeridos

- **Anuncio de 10s**: 50€/mes
- **Anuncio de 12s**: 60€/mes
- **Anuncio de 15s**: 75€/mes

*Con 15 anunciantes y emisiones 24/7, cada comercio obtiene ~2,880 reproducciones diarias*

## 🚀 Próximas Mejoras

- [ ] Audio files pregrabados en lugar de TTS
- [ ] Programación horaria de anuncios (ej: más anuncios en hora punta)
- [ ] Analytics detallados de reproducciones
- [ ] A/B testing de scripts
- [ ] Integración con Google Ads
- [ ] Sistema de facturación automático

## 📞 Contacto para Anunciantes

Para agregar tu negocio a la emisora:

1. Prepara tu script publicitario (10-15 segundos)
2. Proporciona: nombre, dirección, teléfono, descripción
3. Opcional: logo, imagen, audio grabado
4. Contacta: [tu-email@ejemplo.com]

---

**Sistema de Publicidad Local Dinámica** - Potenciando el comercio de Almendralejo 🏪🎵
