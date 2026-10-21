import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function boot(marker){
 const calls=[],errors=[],module={};
 const {outputText}=ts.transpileModule(readFileSync('src/client.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 const document={documentElement:{dataset:{clientShell:marker}}};
 const dependencies={react:{StrictMode:'strict',startTransition:fn=>fn()},'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'@tanstack/react-start/client':{StartClient:'start'},'react-dom/client':{createRoot:d=>({render:app=>calls.push({mode:'mount',d,app})}),hydrateRoot:(d,app,options)=>calls.push({mode:'hydrate',d,app,options})}};
 new Function('exports','require','document','console',outputText)(module,id=>dependencies[id],document,{error:e=>errors.push(e)});return {calls,errors,document};
}
test('static Pages shell mounts its app without trying to hydrate missing server content',()=>{
 const {calls,document}=boot('true');assert.equal(calls.length,1);assert.equal(calls[0].mode,'mount');assert.equal(calls[0].d,document);
 assert.equal(calls[0].app.props.children.type,'start');
 assert.ok(readFileSync('scripts/write-pages-html.mjs','utf8').includes('data-client-shell="true"'));
});
test('server-rendered output retains hydration and reports actual recovery errors',()=>{
 for(const marker of [undefined,'false']){
  const {calls,errors}=boot(marker);assert.equal(calls.length,1);assert.equal(calls[0].mode,'hydrate');
  const error=new Error('Hydration mismatch');calls[0].options.onRecoverableError(error);assert.deepEqual(errors,[error]);
 }
});
