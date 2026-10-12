/** 
 * Reglas puras del intercalado. Medimos solo segundos REALES de canción,
 * nunca tiempo de pared o segundos transcurridos durante la cuña.
 */
export const AD_INTERVAL_SECONDS = 10;
export const AD_SPOT_DURATION_MS = 10_000;

export function nextAdMark(mediaSeconds: number): number {
  if (!Number.isFinite(mediaSeconds) || mediaSeconds < 0) return AD_INTERVAL_SECONDS;
  return (Math.floor(mediaSeconds / AD_INTERVAL_SECONDS) + 1) * AD_INTERVAL_SECONDS;
}

export function isAdDue(
  mediaSeconds: number,
  targetSeconds: number,
  isMusicPlaying: boolean,
  adAlreadyPlaying: boolean,
  enabled: boolean
): boolean {
  return (
    enabled &&
    isMusicPlaying &&
    !adAlreadyPlaying &&
    Number.isFinite(mediaSeconds) &&
    Number.isFinite(targetSeconds) &&
    mediaSeconds >= targetSeconds &&
    targetSeconds > 0
  );
}
