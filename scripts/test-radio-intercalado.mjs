import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const timing = read('src/lib/adTiming.ts');
const transpile = code => ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  reportDiagnostics: true,
}).outputText;
const runTs = (source, requireFn = () => { throw Error('Dependencia imprevista'); }) => {
  const module = { exports: {} };
  vm.runInNewContext(transpile(source), {
    module, exports: module.exports, require: requireFn, console, Math, Number,
  });
  return module.exports;
};
const { nextAdMark, isAdDue, AD_INTERVAL_SECONDS, AD_SPOT_DURATION_MS } = runTs(timing);
assert.equal(AD_INTERVAL_SECONDS, 10);
assert.equal(AD_SPOT_DURATION_MS, 15000);
const timingSource = read('src/lib/adTiming.ts');
assert.match(timingSource, /AD_SPOT_WATCHDOG_MS = 60_000/);
for (const [time, next] of [[0,10],[9.99,10],[10,20],[10.2,20],[19.9,20],[20,30],[120.5,130]]) {
  assert.equal(nextAdMark(time), next, 'Umbral ' + time);
}
assert.equal(isAdDue(9.99,10,true,false,true),false);
assert.equal(isAdDue(10,10,true,false,true),true);
assert.equal(isAdDue(20.05,20,true,false,true),true);
assert.equal(isAdDue(10,10,false,false,true),false,'No anunciar en pausa');
assert.equal(isAdDue(10,10,true,true,true),false,'No solapar anuncios');
assert.equal(isAdDue(10,10,true,false,false),false,'Respetar publicidad desactivada');
assert.equal(isAdDue(Number.NaN,10,true,false,true),false);
const advertisers = JSON.parse(read('src/data/advertisers.json')).filter(a=>a.enabled);
assert.ok(advertisers.length >= 60, 'Catálogo ampliamente ampliado');
assert.ok(advertisers.every(a=>a.duration>=15), 'Mínimo de 15 segundos');
assert.ok(advertisers.every(a=>a.sourceUrl && a.sourceUrl.startsWith('https://')), 'Fuentes de los anunciantes');
assert.ok(advertisers.every(a=>a.sponsored === false), 'No atribuir patrocinio');
assert.ok(advertisers.every(a=>!a.adScript.toLowerCase().includes('negocio de utrera')), 'Frase prohibida');
assert.ok(advertisers.every(a=>a.adScript.trim().split(/\s+/).length >= 43), 'Cuñas con contenido hablado suficiente');
assert.equal(new Set(advertisers.map(a=>a.id)).size, advertisers.length, 'Nombres únicos');
const schedulerSource = read('src/lib/adScheduler.ts');
const { adScheduler } = runTs(schedulerSource, path => {
  assert.equal(path, '../data/advertisers.json');
  return advertisers;
});
const selected = Array.from({length:advertisers.length*3}, () => adScheduler.getNextAd().id);
for(let i=0;i<selected.length;i++) {
  if(i) assert.notEqual(selected[i],selected[i-1], 'No repetir cuñas contiguas');
}
for(let i=0;i<3;i++) {
  assert.equal(new Set(selected.slice(i*advertisers.length,(i+1)*advertisers.length)).size,
    advertisers.length, 'Todas las cuñas antes de repetir');
}
const appSource = read('src/App.tsx');
assert.ok(appSource.includes('audio.src = updatedState.streamUrl'), 'Usar URL actualizada');
assert.ok(!appSource.includes('audio.src = store.streamUrl!'), 'No usar URL obsoleta');
assert.ok(appSource.includes('onTimeUpdate={handleMusicTimeUpdate}'));
assert.ok(!appSource.includes('await unlockTTS()'), 'No bloquear inicio por TTS');
assert.ok(appSource.includes('minimumReached && voiceFinished'), 'Esperar mínimo y final de voz');
assert.ok(appSource.includes('AD_SPOT_WATCHDOG_MS'), 'Fail-safe de síntesis');
console.log('PASS: música 10 s + cuña >= 15 s sin recortes + '+advertisers.length+' anunciantes + rotación');
