# Intercalado publicitario — Revisión 12/10/2026

La radio reproduce **diez segundos de música** y luego una **única cuña de al menos quince segundos**, antes de reanudar la canción por el segundo exacto en el que se detuvo. La siguiente cuña se programa tras otros diez segundos de canción; nunca se cuentan segundos de pausa como música.

Los guiones no contienen la frase «negocio de Utrera». Se han registrado **73 establecimientos** identificados en fuentes públicas, con categorías distintas y rotación barajada sin reposición. Los nombres no implican patrocinio: son menciones informativas y las promociones, los precios y los acuerdos comerciales no han sido inventados.

El bloque de cuña se cierra solo cuando se cumplen simultáneamente el mínimo de 15 segundos y el evento `onend` del sintetizador. Si Web Speech API queda atascado se recupera la reproducción a los 60 segundos, con registro de error. Algunos motores TTS o dispositivos pueden generar locuciones con diferentes velocidades y limitaciones; las pruebas unitarias no equivalen a una audición completa en todos los navegadores.

Comprobaciones: `npm run typecheck`, `npm run test:ads`, `npm run build`.

Fuentes principales:
- Ruta de la Tapa y Aceituna Gordal 2026 del Ayuntamiento: https://www.utrera.org/en/ruta-tapa-aceituna-gordal-utrera-2026/
- Pasaporte de Compras Zona Norte 2025: https://www.utreraweb.com/noticias-de-utrera/economia/2025/19316/El-Grupo-de-Comercios-de-la-Zona-Norte-lanza-un-ano-mas-el-%E2%80%98Pasaporte-de-Compras%E2%80%99-para-impulsar-el-comercio-de-Utrera/
- Comercio histórico local: https://www.utreradigital.com/web/encarnacion-juan-enrique-y-francisco-gomez-valencia-tres-hermanos-al-frente-de-uno-de-los-comercios-mas-antiguos-de-utrera/
- Panaderías y pastelerías: https://tartapan.com/pastelerias-y-panaderias-en-utrera/
- Directorio empresarial: https://negocioscerca.es/localidad/utrera

Antes de comercializar espacios publicitarios deben confirmarse vigencia y autorización de cada anunciante.
