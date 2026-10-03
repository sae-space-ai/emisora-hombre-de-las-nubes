/**
 * Script para actualizar el catálogo desde Audius
 * Se ejecuta vía GitHub Actions cada 24 horas
 */

import { fetchAllArtistTracks, getArtistProfile, buildCatalog } from '../src/lib/audius.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateCatalog() {
  console.log('🔄 Iniciando actualización del catálogo...');
  
  try {
    // Obtener datos de Audius
    console.log('📡 Obteniendo perfil del artista...');
    const artist = await getArtistProfile();
    
    if (!artist) {
      throw new Error('No se pudo obtener el perfil del artista');
    }
    
    console.log(`✅ Artista: ${artist.name} (@${artist.handle})`);
    console.log(`📊 Tracks reportados: ${artist.track_count}`);
    
    console.log('📥 Descargando todas las pistas...');
    const tracks = await fetchAllArtistTracks();
    
    console.log(`✅ ${tracks.length} pistas descargadas`);
    
    // Construir catálogo enriquecido
    console.log('🏷️  Clasificando y catalogando...');
    const catalog = buildCatalog(artist, tracks);
    
    // Guardar en archivo JSON
    const outputPath = join(__dirname, '../src/data/catalog.json');
    writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
    
    console.log(`💾 Catálogo guardado en: ${outputPath}`);
    console.log(`📦 Total: ${catalog.totalTracks} pistas en ${catalog.albums.length} álbumes`);
    console.log(`🕐 Última actualización: ${catalog.lastUpdated}`);
    
    // Resumen por álbum
    console.log('\n📚 Resumen por álbum:');
    catalog.albums.forEach(album => {
      console.log(`  - ${album.name}: ${album.trackIds.length} pistas`);
    });
    
    console.log('\n✅ Actualización completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error actualizando catálogo:', error);
    process.exit(1);
  }
}

updateCatalog();
