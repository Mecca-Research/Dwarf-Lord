"""Select examined source-only actor and separately authored persistent props."""
from pathlib import Path
import json,hashlib,shutil
p=Path('work/expanded-cycles/motion48/cook-dough');actor=Path('public/sprites/Cook/motion/knead-dough/actor');station=Path('public/sprites/workstations/dough-block');assert not actor.exists()and not station.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text())
def save(p,j):p.write_text(json.dumps(j,indent=2)+'\n')
shutil.copytree(p/'actor-candidate',actor)
entry=load(p/'entry-candidate48.json');entry['destination']=str(actor);entry['notes']='Source-only original registered poses, extracted actor/visible dough, independent fixed kneading block, source hand foreground and separately authored persistent dough after departure.'
add=Path('docs/runtime-motion-additions.json');a=load(add);a['entries'].append(entry);save(add,a)
station.mkdir();(station/'authoring-inputs').mkdir()
shutil.copy2(p/'station-source48.png',station/'source.png');shutil.copy2(p/'station-candidate48.png',station/'sprite.png')
shutil.copy2(p/'completion-source48.png',station/'authoring-inputs/dough48.png');shutil.copy2(p/'completion-candidate48.png',station/'completed-dough.png')
r=load(p/'station-request48.json');cr=load(p/'completion-request48.json');layer=load(p/'layer-config48.json')
g={'sourceSha256':sha(station/'source.png'),'spriteSha256':sha(station/'sprite.png'),'prompt':r['prompt'],
 'reference':'../../Cook/motion/knead-dough/reference/00.png','referenceSha256':sha(Path('public/sprites/Cook/motion/knead-dough/reference/00.png')),
 'placement':layer['stationPlacement'],'targetBodyHeight':562,'targetAnchor':[320,616],'productionReady':False,
 'placementReview':'One uniform400px normalization of the complete independent table. Native all8 source hand/dough contacts reviewed above fixed flour surface; final gameplay proof pending.',
 'completionLayer':{'source':'authoring-inputs/dough48.png','sourceSha256':sha(station/'authoring-inputs/dough48.png'),
 'file':'completed-dough.png','sha256':sha(station/'completed-dough.png'),
 'placement':{'width':146,'x':279,'y':271,'canvas':[640,640],'alphaThreshold':128},'prompt':cr['prompt'],
 'reference':'../../Cook/motion/knead-dough/reference/07.png','referenceSha256':sha(Path('public/sprites/Cook/motion/knead-dough/reference/07.png')),
 'scope':'Separately authored previously occluded dough top after palms leave. Same registered oval footprint and surface. A cosmetic retained workpiece, not baked bread or economic output.'}}
save(station/'generation.json',g)
calpath=Path('public/sprites/Cook/motion/render-calibration.json');cal=load(calpath);cal['actions']['knead-dough/actor']={'sourceSha256':sha(actor/'source-sheet.png'),'targetBodyHeight':562,'targetAnchor':[320,616],
 'method':'exact-source-pixel-registered-body-and-foreground','foregroundPolygons':layer['foregroundPolygons'],'review':'Literal selected source frames, no redraw/warp/per-frame scale. Manual native head-to-visible-sole extent. New fixed table/dough native compositing reviewed; hidden legs remain unobserved, actual task/handoff proof pending.'};save(calpath,cal)
libpath=Path('public/workstation-library.json');lib=load(libpath);lib.append({'character':'Cook','action':'knead-dough','actor':'sprites/Cook/motion/knead-dough/actor/manifest.json','calibration':'sprites/Cook/motion/render-calibration.json','station':'sprites/workstations/dough-block/generation.json'});save(libpath,lib)
print('Selected native layers; task approval remains pending actual rendering')
