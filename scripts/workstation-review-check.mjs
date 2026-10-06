import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { workstationTransform } from '../public/workstation-registration.mjs';
const library=JSON.parse(readFileSync('public/workstation-library.json'));
const output=process.env.REVIEW_OUTPUT??'work/expanded-cycles/station-layer-browser';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1060,height:1150}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(process.env.REVIEW_URL??'http://localhost:8081/Dwarf-Lord/workstation-review.html');
 const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&!JSON.parse(window.render_game_to_text()).loading);
 await ready();const count=await page.locator('#station option').count();assert.equal(count,library.length);
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const pixels=()=>page.evaluate(()=>document.querySelector('canvas').toDataURL());
 for(let i=0;i<count;i++) {
  await page.selectOption('#station',String(i));await ready();const before=await state();
  assert.equal(before.frame,0);
  if(process.env.REVIEW_ACCEPTANCE!=='pending'){
   assert.equal(before.approved,true);
   assert.equal(before.approvalType,before.character==='Laborer'||i>=7?'once-hold-task':'loop');
  }
  const calibration=JSON.parse(readFileSync('public/'+library[i].calibration));
  const placement=calibration.actions[library[i].action+'/actor'];
  const stationRegistration=JSON.parse(readFileSync('public/'+library[i].station));
  const transform=workstationTransform(placement,stationRegistration);
  assert.deepEqual(before.propTransform,transform,'review uses the same physical root and body bases as gameplay');
  const foreground=placement.foregroundPolygons;
  const retainedIdentity=transform.scale===1&&transform.x===0&&transform.y===0;
  const identicalLegacyFrames=[];
  const name=before.character+'-'+library[i].action;
  for(let frame=0;frame<8;frame++) {
   await page.locator('#frame').evaluate((e,n)=>{e.value=n;e.dispatchEvent(new Event('input'))},frame);
   assert.equal((await state()).frame,frame);
   if(retainedIdentity){
    const equal=await page.evaluate(async({entry,frame,polygons})=>{
     const load=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url});
     const base=new URL(entry.actor,location.href),manifest=await (await fetch(base)).json();
     const [actor,prop]=await Promise.all([load(new URL(manifest.frames[frame].file,base)),load(new URL('sprite.png',new URL(entry.station,location.href)))]);
     const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;const ctx=canvas.getContext('2d');
     ctx.drawImage(actor,0,0);ctx.drawImage(prop,0,0);
     for(const polygon of polygons){ctx.save();ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(actor,0,0);ctx.restore()}
     const old=ctx.getImageData(0,0,640,640).data,current=document.querySelector('#canvas').getContext('2d').getImageData(0,0,640,640).data;
     return old.every((value,index)=>value===current[index]);
    },{entry:library[i],frame,polygons:foreground[frame]});
    assert.equal(equal,true,'unchanged shared-basis layers remain pixel-identical to the prior renderer');
    identicalLegacyFrames.push(frame);
   }
   if(process.env.REVIEW_ALL_FRAMES==='1')await page.screenshot({path:`${output}/${name}-frame-${frame}.png`});
  }
  const combined=await pixels();await page.uncheck('#foreground');
  if(foreground.some(polygons=>polygons.length))assert.notEqual(await pixels(),combined,'foreground changes actual pixels');
  else assert.equal(await pixels(),combined,'actor entirely behind or above the prop needs no duplicated foreground');
  await page.check('#foreground');await page.uncheck('#actor');const propOnly=await pixels();
  await page.locator('#frame').evaluate(e=>{e.value=2;e.dispatchEvent(new Event('input'))});
  assert.equal(await pixels(),propOnly,'station pixels remain fixed as frame changes');
  await page.screenshot({path:`${output}/${name}-station.png`});
  await page.check('#actor');await page.click('#restart');await page.click('#play');await page.evaluate(()=>window.advanceTime(2000));
  const completed=await state();assert.equal(completed.frame,7);assert.equal(completed.completed,true);assert.equal(completed.completions,1);assert.equal(completed.playing,false);
  await page.evaluate(()=>window.advanceTime(5000));assert.equal((await state()).completions,1);
  await page.screenshot({path:`${output}/${name}-layered.png`});
  if(before.character==='Laborer'||(before.character==='Cook'&&library[i].action==='knead-dough')) {
   await page.uncheck('#actor');assert.equal((await state()).completedProp,true);
   assert.notEqual(await pixels(),propOnly,'finished workpiece remains after completed actor leaves');
   await page.screenshot({path:`${output}/${name}-completed-station.png`});
   await page.click('#restart');assert.equal((await state()).completedProp,false,'new task resets visual staging');
   await page.check('#actor');
  }
  await page.click('#restart');await page.check('#repeat');await page.click('#play');await page.evaluate(()=>window.advanceTime(2200));
  assert.equal((await state()).completed,false);assert.equal((await state()).playing,true);
  await page.click('#play');await page.uncheck('#repeat');results.push({...completed,physicalTransform:transform,identicalLegacyFrames});
 }
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({results,errors},null,2));
 console.log(`PASS ${count} eight-frame workstation layers, fixed props, tool occlusion, once-hold, released crate and explicit review playback`);
} finally {await browser.close()}
