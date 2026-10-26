import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import ts from 'typescript';
import { grokPwaPlugin } from './grok-pwa-plugin.mjs';

function assets(BASE_URL, VITE_PUBLIC_ASSET_BASE) {
  const source = readFileSync('src/lib/asset.ts', 'utf8')
    .replaceAll('import.meta.env', JSON.stringify({ BASE_URL, VITE_PUBLIC_ASSET_BASE }));
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } });
  const exports = {};
  new Function('exports', outputText)(exports);
  return exports.asset;
}
const immutable = 'https://static.example/source-sha/public/';

test('generated PWA URLs, app endpoints and modules stay on the app base with a static override', () => {
  for (const base of ['/', '/Dwarf-Lord/', '/Dwarf-Lord-preview/']) {
    const asset = assets(base, immutable);
    for (const path of ['__grok/manifest.webmanifest', '__grok/manifest.json?v=2',
      '__grok/icon-180.png', '__grok/manifest.webmanifest?install=1#app',
      'api/config.json', 'motion-playback.mjs', 'workstation-registration.mjs', 'art/test.js']) {
      assert.equal(asset('/' + path), base + path);
      assert.equal(asset(base + path), base + path, 'already-prefixed app URL');
    }
  }
});

test('public images and sprite data retain immutable URLs, queries and prefix idempotence', () => {
  const asset = assets('/Dwarf-Lord-preview/', immutable.slice(0, -1));
  for (const path of ['art/camp-earth-v2.webp', 'textures/wood.jpg?v=2',
    'sprites/Female Miner/stand.png', 'sprites/Cook/motion/stir-cauldron/actor/manifest.json#v1', 'favicon.svg']) {
    assert.equal(asset('/' + path), immutable + path);
    assert.equal(asset('/Dwarf-Lord-preview/' + path), immutable + path);
    assert.equal(asset(asset('/' + path)), immutable + path);
  }
});

test('normal app builds preserve relative assets and explicit external URLs', () => {
  for (const base of ['/', '/Dwarf-Lord/']) {
    const asset = assets(base);
    assert.equal(asset('/art/camp-vista.jpg'), base + 'art/camp-vista.jpg');
    assert.equal(asset(base + 'art/camp-vista.jpg'), base + 'art/camp-vista.jpg');
    for (const url of ['https://other.example/file.png', '//other.example/file.png']) assert.equal(asset(url), url);
  }
});

test('static overrides still request each host’s generated manifest from the app', async () => {
  const handlers = [];
  grokPwaPlugin().configureServer({middlewares:{use:fn=>handlers.push(fn)}});
  const server = createServer((req,res)=>{
    let i=0;
    const next=()=>{const fn=handlers[i++];if(fn)fn(req,res,next);else{res.writeHead(404);res.end();}};
    next();
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    const origin=`http://127.0.0.1:${server.address().port}`;
    const url=new URL(assets('/',immutable)('/__grok/manifest.webmanifest'),origin);
    assert.equal(url.origin,origin);
    for(const [host,name] of [['alpine-camp.grok.me','Alpine Camp'],['valley-camp.grok.me','Valley Camp']]){
      const response=await fetch(url,{headers:{'x-forwarded-host':host}});
      assert.equal(response.status,200);
      assert.match(response.headers.get('content-type'),/application\/manifest\+json/);
      assert.equal(response.headers.get('cache-control'),'no-cache');
      assert.equal((await response.json()).name,name);
    }
  } finally {await new Promise(done=>server.close(done));}
});
