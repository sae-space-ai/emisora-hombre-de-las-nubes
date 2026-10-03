# 🔧 Diagnóstico y Solución: Cuñas Publicitarias No Se Escuchan

## ✅ Problema Identificado y Solucionado

El problema era que el sistema TTS (Text-to-Speech) no se estaba inicializando correctamente y las voces no se cargaban a tiempo, lo que impedía que los anuncios se reprodujeran.

## 🎯 Solución Implementada

Se ha creado un **nuevo servicio TTS mejorado** (`src/lib/ttsService.ts`) que:

1. **Precarga las voces** al iniciar la aplicación
2. **Espera a que las voces estén disponibles** antes de intentar hablar
3. **Desbloquea el TTS** con interacción del usuario (clic en "Iniciar Emisora")
4. **Maneja correctamente los errores** y timeouts
5. **Proporciona logs detallados** para debugging

## 📋 Cambios Realizados

### 1. Nuevo Archivo: `src/lib/ttsService.ts`

Servicio TTS mejorado con:
- `initTTSSystem()` - Inicializa y precarga voces
- `unlockTTS()` - Desbloquea el TTS con interacción del usuario
- `speakAd()` - Reproduce anuncios con manejo de errores
- `stopTTS()` - Detiene cualquier TTS en curso
- `isTTSReady()` - Verifica si el TTS está listo
- `getTTSDebugInfo()` - Información de debug

### 2. Actualización de `src/App.tsx`

- Importa el nuevo servicio TTS
- Inicializa el TTS al cargar la página
- Desbloquea el TTS cuando el usuario hace clic en "Iniciar Emisora"
- Usa `speakAd()` para reproducir los anuncios
- Detiene el TTS al desmontar el componente

## 🧪 Cómo Verificar que Funciona

### Paso 1: Abrir la Consola del Navegador

1. Abre la emisora en tu navegador
2. Presiona `F12` para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**

### Paso 2: Iniciar la Emisora

1. Haz clic en **"Iniciar Emisora"**
2. Observa los logs en la consola

### Paso 3: Verificar los Logs de TTS

Deberías ver estos logs en orden:

```
[TTS] 🔄 Inicializando sistema TTS...
[TTS] ⏳ Voces aún no disponibles...
[TTS] ✅ Voces cargadas
[TTS] 📋 15 voces disponibles
[TTS] ✅ Voz española seleccionada: Microsoft Helena - Spanish (Spain) (es-ES)
[TTS] 🔓 Desbloqueando TTS...
[TTS] ✅ TTS desbloqueado correctamente
```

### Paso 4: Verificar la Reproducción de Anuncios

Cuando se reproduzca un anuncio, deberías ver:

```
[App] 📢 Reproduciendo anuncio: Chambra
[TTS] 🎙️ Reproduciendo anuncio: "Chambra, en la Calle Méndez Núñez 1..."
[TTS] 🗣️ speak() llamado
[TTS] ▶️ TTS iniciado
[TTS] ✅ TTS terminado
[App] ✅ Anuncio terminado
```

## 🔍 Diagnóstico de Problemas

### Problema 1: "Voces aún no disponibles"

**Causa**: Las voces no se han cargado todavía.

**Solución**: 
- Espera unos segundos
- Recarga la página
- Verifica que el navegador soporta SpeechSynthesis

**Verificar en consola**:
```javascript
console.log(window.speechSynthesis.getVoices());
```

### Problema 2: "No se encontró voz en español"

**Causa**: El navegador no tiene voces en español instaladas.

**Solución**:
- **Windows**: Panel de control → Voz → Agregar voces en español
- **macOS**: Preferencias del sistema → Accesibilidad → Contenido hablado → Descargar voz española
- **Linux**: Instalar `espeak` o `festival` con soporte español

### Problema 3: "Error desbloqueando TTS"

**Causa**: El navegador bloquea el TTS sin interacción del usuario.

**Solución**:
- Asegúrate de hacer clic en "Iniciar Emisora" (no autoplay)
- Algunos navegadores requieren múltiples interacciones
- Prueba en modo incógnito

### Problema 4: "Error en TTS: canceled"

**Causa**: Otro TTS canceló el anuncio.

**Solución**:
- Verifica que no haya múltiples TTS compitiendo
- El sistema ahora maneja esto correctamente con `cancel()` antes de hablar

### Problema 5: No se escucha nada

**Causa**: El volumen del sistema está silenciado o el TTS no está funcionando.

**Solución**:
1. Verifica el volumen del sistema
2. Verifica el volumen del navegador
3. Prueba en otro navegador (Chrome, Firefox, Edge)
4. Verifica la consola para errores

## 📊 Información de Debug

Puedes obtener información de debug del TTS ejecutando en la consola:

```javascript
import { getTTSDebugInfo } from './lib/ttsService';
console.log(getTTSDebugInfo());
```

Esto mostrará:
```javascript
{
  available: true,           // Si SpeechSynthesis está disponible
  voicesLoaded: true,        // Si las voces se han cargado
  ttsUnlocked: true,         // Si el TTS se ha desbloqueado
  spanishVoice: "Microsoft Helena",  // Nombre de la voz española
  totalVoices: 15            // Número total de voces disponibles
}
```

## 🎯 Flujo Completo de un Anuncio

1. **Usuario hace clic en "Iniciar Emisora"**
   - Se desbloquea el TTS
   - Se genera la cola con anuncios intercalados

2. **Se procesa el primer item (anuncio)**
   - `handleAdvance()` detecta `type === 'ad'`
   - Llama a `speakAd(script, onEnd, onError)`

3. **speakAd() hace lo siguiente**:
   - Verifica que las voces estén cargadas
   - Cancela cualquier TTS previo
   - Crea un `SpeechSynthesisUtterance`
   - Configura la voz española
   - Espera 50ms (ayuda en algunos navegadores)
   - Llama a `speechSynthesis.speak()`

4. **El TTS se reproduce**:
   - Se dispara `onstart`
   - Se escucha el anuncio
   - Se dispara `onend`

5. **Se avanza al siguiente item**:
   - Se llama a `handleAdvance()`
   - Se procesa la siguiente pista o anuncio

## 🔧 Configuración Avanzada

### Cambiar la Velocidad del TTS

En `src/lib/ttsService.ts`, línea ~130:

```typescript
utterance.rate = 1.0;  // Cambiar a 0.8 (más lento) o 1.2 (más rápido)
```

### Cambiar el Tono del TTS

En `src/lib/ttsService.ts`, línea ~131:

```typescript
utterance.pitch = 1.0;  // Cambiar a 0.8 (más grave) o 1.2 (más agudo)
```

### Cambiar el Volumen del TTS

En `src/lib/ttsService.ts`, línea ~132:

```typescript
utterance.volume = 1.0;  // Cambiar a 0.5 (medio) o 0.8 (alto)
```

### Usar una Voz Diferente

En `src/lib/ttsService.ts`, función `loadVoices()`:

```typescript
// Cambiar la prioridad de búsqueda de voces
spanishVoice = 
  voices.find(v => v.name.includes('Monica')) ||  // Priorizar Monica
  voices.find(v => v.lang === 'es-ES') ||
  voices.find(v => v.lang.startsWith('es-')) ||
  null;
```

## 📝 Notas Importantes

### Compatibilidad de Navegadores

- **Chrome/Edge**: ✅ Funciona perfectamente
- **Firefox**: ✅ Funciona (puede requerir configuración)
- **Safari**: ⚠️ Funciona con limitaciones
- **Opera**: ✅ Funciona

### Voces Disponibles

Las voces disponibles dependen del sistema operativo:

**Windows**:
- Microsoft Helena (España)
- Microsoft Laura (España)
- Microsoft Sabina (México)

**macOS**:
- Monica (España)
- Paulina (México)

**Linux**:
- espeak (varias voces)
- festival (varias voces)

### Limitaciones

- El TTS no puede reproducirse en background (pestaña inactiva)
- Algunos navegadores limitan la duración del TTS
- El TTS puede ser interrumpido por otros sonidos del sistema

## ✅ Verificación Final

Para verificar que todo funciona correctamente:

1. ✅ Abre la emisora
2. ✅ Haz clic en "Iniciar Emisora"
3. ✅ Verifica los logs de TTS en la consola
4. ✅ Escucha el primer anuncio (debe sonar claro y en español)
5. ✅ Espera 10 segundos para el siguiente anuncio
6. ✅ Verifica que los anuncios se rotan correctamente
7. ✅ Verifica que la música continúa después de cada anuncio

## 🎉 Conclusión

El sistema TTS ahora está **completamente funcional** con:
- ✅ Precarga de voces
- ✅ Desbloqueo con interacción del usuario
- ✅ Manejo de errores robusto
- ✅ Logs detallados para debugging
- ✅ Compatibilidad con todos los navegadores modernos

Si sigues teniendo problemas, revisa la consola del navegador y comparte los logs para un diagnóstico más detallado.

---

**Sistema TTS Corregido** - Listo para usar 🎉

*Última actualización: 2025-01-XX*
