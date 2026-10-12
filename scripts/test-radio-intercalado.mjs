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
assert.equal(AD_SPOT_DURATION_MS, 10000);
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
assert.ok(advertisers.length >= 2);
assert.ok(advertisers.every(a=>a.duration===10));
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
console.log('PASS: 10 s reales + un solo anuncio + rotación + URL actualizada + arranque sin bloqueo');
