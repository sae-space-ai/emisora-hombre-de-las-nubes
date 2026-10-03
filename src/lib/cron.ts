/**
 * ============================================================================
 * FASE 7: CRON JOB - ENDPOINT DE ACTUALIZACIÓN DEL CATÁLOGO
 * ============================================================================
 * En entorno Vite (client-side), este módulo simula el endpoint
 * /api/cron/update-catalog que en Next.js sería una API Route.
 * 
 * En producción con Next.js, esto sería: app/api/cron/update-catalog/route.ts
 * 
 * Se activa cada 24h vía Vercel Cron o GitHub Actions.
 */

import { fetchAllArtistTracks, getArtistProfile, buildCatalog, Catalog } from './audius';
import { saveCatalog, loadCatalog } from './persistence';
import { logSystem, logError } from './logger';

/**
 * FASE 7.2-7.4: Actualiza el catálogo desde Audius
 * Detecta nuevas pistas y actualiza la persistencia
 */
export async function updateCatalog(): Promise<{
  success: boolean;
  previousCount: number;
  newCount: number;
  hasNewTracks: boolean;
  message: string;
}> {
  try {
    logSystem('🔄 [CRON] Iniciando actualización del catálogo...');

    // Cargar catálogo actual
    const currentCatalog = loadCatalog();
    const previousCount = currentCatalog?.tracks.length || 0;

    // Obtener datos frescos de Audius
    const artist = await getArtistProfile();
    const tracks = await fetchAllArtistTracks();
    const newCatalog = buildCatalog(artist, tracks);

    // Guardar nuevo catálogo
    saveCatalog(newCatalog);

    const hasNewTracks = tracks.length > previousCount;
    const message = hasNewTracks
      ? `Catálogo actualizado: ${previousCount} → ${tracks.length} pistas (+${tracks.length - previousCount} nuevas)`
      : `Catálogo sin cambios: ${tracks.length} pistas`;

    logSystem(`✅ [CRON] ${message}`);

    return {
      success: true,
      previousCount,
      newCount: tracks.length,
      hasNewTracks,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError('[CRON] Error actualizando catálogo', errorMsg);
    return {
      success: false,
      previousCount: 0,
      newCount: 0,
      hasNewTracks: false,
      message: `Error: ${errorMsg}`,
    };
  }
}

/**
 * FASE 7.5: Obtiene el resumen de logs
 */
export function getCatalogStatus(): {
  lastUpdated: string | null;
  trackCount: number;
  albumCount: number;
} {
  const catalog = loadCatalog();
  return {
    lastUpdated: catalog?.lastUpdated || null,
    trackCount: catalog?.tracks.length || 0,
    albumCount: catalog?.albums.length || 0,
  };
}

/**
 * Versión para Next.js API Route (referencia)
 * 
 * En Next.js 14 App Router, esto sería:
 * 
 * // app/api/cron/update-catalog/route.ts
 * import { NextResponse } from 'next/server';
 * import { updateCatalog } from '@/lib/cron';
 * 
 * export async function GET(request: Request) {
 *   // Verificar que la petición viene del cron de Vercel
 *   const authHeader = request.headers.get('authorization');
 *   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   const result = await updateCatalog();
 *   return NextResponse.json(result);
 * }
 */
