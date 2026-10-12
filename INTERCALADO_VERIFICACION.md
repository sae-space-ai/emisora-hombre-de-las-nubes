# Verificación de intercalado — 12/10/2026

**Norma de emisión:** a los 10, 20, 30... segundos de tiempo realmente reproducido de cada pista, se pausa el audio de Audius, se emite **una sola** locución con duración máxima de 10 segundos y después se reanuda la misma pista en su posición. El reloj de anuncios no avanza durante la pausa.

**Incidencia corregida:** `store.streamUrl` se leía del snapshot obsoleto de Zustand, inmediatamente después de `setCurrentTrack`. Se usa `useRadioStore.getState().streamUrl`; la bienvenida ya no bloquea `audio.play()`.

**Comprobación:** `npm ci && npm run typecheck && npm run test:ads && npm run build`. El test verifica el umbral de 10 s, los casos de pausa y desactivación, la inexistencia de anuncios solapados, la rotación sin reposición y la URL de Audius.

**Condicionante externo:** Web Speech API depende de las voces instaladas y políticas del navegador; la compilación y las pruebas de lógica no equivalen a escuchar físicamente la cuña en cada dispositivo.
