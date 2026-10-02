/**
 * Generador de Archivos de Audio de Ejemplo
 * Crea archivos MP3 de prueba usando Web Audio API
 */

export async function generateTestAdAudio(
  text: string,
  durationSeconds: number = 10
): Promise<Blob> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * durationSeconds;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Generar un tono simple con variación para simular voz
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    
    // Frecuencia base que varía para simular voz
    const baseFreq = 150 + Math.sin(t * 2) * 50;
    
    // Generar onda compleja
    const wave1 = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
    const wave2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2;
    const wave3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;
    
    // Envolvente para simular palabras
    const envelope = Math.sin(Math.PI * t / durationSeconds) * 
                     (0.5 + 0.5 * Math.sin(t * 8));
    
    data[i] = (wave1 + wave2 + wave3) * envelope;
  }

  // Convertir a WAV
  const wavBlob = bufferToWave(buffer, length);
  
  audioContext.close();
  
  return wavBlob;
}

/**
 * Convierte AudioBuffer a WAV Blob
 */
function bufferToWave(buffer: AudioBuffer, length: number): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Interleave channels
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Genera todos los archivos de audio de prueba
 */
export async function generateAllTestAds(): Promise<void> {
  console.log('[AudioGenerator] 🎵 Generando archivos de audio de prueba...');
  
  const ads = [
    { name: 'ad_start', text: 'Bienvenida', duration: 15 },
    { name: 'ad_1', text: 'Anuncio 1', duration: 10 },
    { name: 'ad_2', text: 'Anuncio 2', duration: 10 },
    { name: 'ad_3', text: 'Anuncio 3', duration: 10 },
    { name: 'ad_end', text: 'Cierre', duration: 15 },
  ];
  
  for (const ad of ads) {
    try {
      const blob = await generateTestAdAudio(ad.text, ad.duration);
      
      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ad.name}.wav`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      console.log(`[AudioGenerator] ✅ ${ad.name}.wav generado (${ad.duration}s)`);
      
      // Esperar un poco entre descargas
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[AudioGenerator] ❌ Error generando ${ad.name}:`, error);
    }
  }
  
  console.log('[AudioGenerator] 🎉 Todos los archivos generados');
  console.log('[AudioGenerator] 📁 Mueve los archivos a: public/audio/ads/');
}
