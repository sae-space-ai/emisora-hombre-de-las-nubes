# 📝 Guía para Añadir Nuevos Anunciantes

Esta guía explica cómo añadir nuevos comercios de Almendralejo al sistema de publicidad de la emisora.

## 📋 Requisitos Previos

Para añadir un nuevo anunciante necesitas:
- **Nombre del negocio** (obligatorio)
- **Dirección completa** (obligatorio)
- **Descripción breve** (obligatorio, máx. 200 caracteres)
- **Script publicitario** (obligatorio, 10-15 segundos de duración)
- **Teléfono** (opcional)
- **Sitio web** (opcional)
- **Año de fundación** (opcional)

## 🔧 Pasos para Añadir un Anunciante

### 1. Abrir el archivo de anunciantes

Edita el archivo `src/data/advertisers.json`

### 2. Añadir nueva entrada

Añade un nuevo objeto JSON al array con la siguiente estructura:

```json
{
  "id": "nombre_unico_identificador",
  "name": "Nombre del Negocio",
  "category": "Textil, Moda y Accesorios",
  "address": "Dirección completa, Almendralejo",
  "phone": "924 XX XX XX",
  "website": "www.ejemplo.com",
  "since": "2020",
  "description": "Descripción breve del negocio (máx. 200 caracteres)",
  "adScript": "Script publicitario que se leerá con TTS. Incluye nombre, dirección y mensaje principal.",
  "audioFile": null,
  "ttsVoice": "es-ES-Standard-A",
  "duration": 15,
  "enabled": true
}
```

### 3. Campos Explicados

- **`id`**: Identificador único (usa snake_case, ej: `mi_negocio`)
- **`name`**: Nombre comercial del negocio
- **`category`**: Categoría (actualmente "Textil, Moda y Accesorios")
- **`address`**: Dirección completa con "Almendralejo"
- **`phone`**: Teléfono de contacto (formato: "924 XX XX XX")
- **`website`**: URL del sitio web (sin "https://")
- **`since`**: Año de fundación (opcional)
- **`description`**: Descripción breve para mostrar en el banner
- **`adScript`**: **IMPORTANTE** - Texto que se leerá con TTS. Debe ser natural y durar 10-15 segundos
- **`audioFile`**: Deja en `null` (reservado para archivos de audio pregrabados)
- **`ttsVoice`**: Voz TTS (usa "es-ES-Standard-A")
- **`duration`**: Duración estimada del anuncio en segundos (10-30)
- **`enabled`**: `true` para activar, `false` para desactivar

### 4. Ejemplo Completo

```json
{
  "id": "nueva_tienda",
  "name": "Nueva Tienda de Moda",
  "category": "Textil, Moda y Accesorios",
  "address": "Calle Ejemplo, 10, Almendralejo",
  "phone": "924 12 34 56",
  "website": "www.nuevatienda.com",
  "since": "2015",
  "description": "Tienda de moda femenina con las últimas tendencias y marcas exclusivas.",
  "adScript": "Nueva Tienda de Moda, en la Calle Ejemplo 10 de Almendralejo. Las últimas tendencias y marcas exclusivas para ti. Visítanos hoy.",
  "audioFile": null,
  "ttsVoice": "es-ES-Standard-A",
  "duration": 15,
  "enabled": true
}
```

## 🎯 Consejos para el Script Publicitario

### ✅ Buenas Prácticas

1. **Duración**: 10-15 segundos (ni muy corto ni muy largo)
2. **Estructura**:
   - Nombre del negocio
   - Dirección o ubicación
   - Producto/servicio principal
   - Llamada a la acción o mensaje final

3. **Tono**: Profesional pero cercano
4. **Claridad**: Evita jerga técnica o siglas

### 📝 Ejemplos de Scripts

**Buen ejemplo (15s)**:
```
"Boutique Elegancia, en la Calle Mayor 5 de Almendralejo. Moda femenina exclusiva con las mejores firmas nacionales. Tu estilo, nuestra pasión. Boutique Elegancia."
```

**Mal ejemplo (muy largo)**:
```
"Boutique Elegancia es una tienda que lleva más de 20 años en Almendralejo ofreciendo lo mejor en moda femenina. Tenemos una amplia selección de vestidos, blusas, pantalones, faldas, chaquetas, abrigos, zapatos, bolsos y complementos de las mejores marcas nacionales e internacionales. Ven a visitarnos a la Calle Mayor 5 y descubre nuestra nueva colección de primavera-verano con descuentos especiales."
```

## 🧪 Probar el Nuevo Anunciante

1. Guarda el archivo `advertisers.json`
2. Recarga la emisora en el navegador
3. Abre el panel de administración (⚙️)
4. Verifica que el nuevo anunciante aparece en la lista
5. Espera a que se reproduzca (inicio de pista, cada 15s, o final de pista)
6. Verifica que el TTS suena correctamente

## 🎨 Personalización Avanzada

### Cambiar la Voz TTS

Puedes usar diferentes voces modificando el campo `ttsVoice`:
- `es-ES-Standard-A`: Voz femenina española (recomendado)
- `es-ES-Standard-B`: Voz masculina española
- `es-MX-Standard-A`: Voz femenina mexicana

### Usar Audio Pregrabado

Si tienes un archivo de audio profesional:

1. Coloca el archivo en `public/audio/ads/`
2. Modifica el campo `audioFile`:
   ```json
   {
     "audioFile": "/audio/ads/mi_anuncio.mp3",
     "duration": 15
   }
   ```

### Ajustar la Duración

El campo `duration` afecta al audio ducking:
- `10`: Anuncio corto (10 segundos)
- `15`: Anuncio estándar (15 segundos)
- `20`: Anuncio largo (20 segundos)
- `30`: Anuncio muy largo (30 segundos)

## 📊 Estadísticas

El sistema registra automáticamente:
- Número de veces que se reproduce cada anuncio
- Última vez que se reprodujo
- Historial de rotación

Accede a las estadísticas desde el panel de administración.

## ⚠️ Consideraciones Legales

1. **Veracidad**: Asegúrate de que la información es correcta y actualizada
2. **Consentimiento**: Obtén permiso del negocio antes de incluirlo
3. **Privacidad**: No incluyas datos personales (solo datos comerciales públicos)
4. **Precisión**: Verifica direcciones, teléfonos y sitios web

## 🔗 Recursos Útiles

- **Portal de Comercio de Almendralejo**: https://comercio.almendralejo.es
- **Categoría 99 (Textil, Moda y Accesorios)**: https://comercio.almendralejo.es/categoria.php?id_categoria=99
- **Google Maps**: Para verificar direcciones
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

## 📞 Soporte

Si tienes problemas al añadir un anunciante:

1. Verifica que el JSON sea válido (usa https://jsonlint.com)
2. Asegúrate de que el `id` sea único
3. Comprueba que todos los campos obligatorios estén completos
4. Revisa la consola del navegador para ver errores

## 🎉 Ejemplos Reales

Puedes consultar los anunciantes actuales en `src/data/advertisers.json` para ver ejemplos completos y reales de comercios de Almendralejo.

---

**¡Gracias por contribuir al crecimiento de la emisora y al comercio local de Almendralejo!** 🏪🎵
