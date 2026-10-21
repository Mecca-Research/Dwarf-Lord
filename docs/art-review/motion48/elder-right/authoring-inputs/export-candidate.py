"""Preserve one complete authored strip with common scale; no limb edits."""
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

r=Path('.').resolve();sys.path.insert(0,str(r/'scripts'))
p=r/'work/expanded-cycles/motion48/elder-right'
f=p/'candidate-filled';assert not f.exists();(f/'authoring-inputs').mkdir(parents=True)
raw=p/'strip-filled48.png'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def save(path,value):path.write_text(json.dumps(value,indent=2)+'\n')
shutil.copy2(raw,f/'authoring-inputs/strip-filled48.png')
request=json.loads((p/'request-filled48.json').read_text());refs=[]
for i,ref in enumerate(request['references']):
    source=Path(ref['file']);assert sha(source)==ref['sha256']
    name=f'filled-reference48-{i}.png';shutil.copy2(source,f/'authoring-inputs'/name)
    refs.append({**ref,'file':'authoring-inputs/'+name,'originalPath':ref['file']})
save(f/'generation.json',{'method':'Fresh canonical rendering from a depth-ordered authored vector pose guide; unselected candidate.',
     'prompt':request['prompt'],'references':refs,'candidate':True,
     'rawOutput':'authoring-inputs/strip-filled48.png','rawOutputSha256':sha(raw)})
a=np.array(Image.open(raw).convert('RGBA'));h,w=a.shape[:2];solid=a[:,:,3]>128
labels,_=nd.label(solid);sizes=np.bincount(labels.ravel());main=np.argsort(sizes[1:])[-8:]+1
centers=[(int(k),*nd.center_of_mass(solid,labels,int(k)))for k in main];centers.sort(key=lambda q:q[1]);ordered=sorted(centers[:4],key=lambda q:q[2])+sorted(centers[4:],key=lambda q:q[2])
boxes=[]
for k,_,_ in ordered:
    yy,xx=np.where(labels==k);boxes.append([int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)])
splits=[(boxes[i][3]+boxes[i+4][1])//2 for i in range(4)]
assert all(boxes[i][3]<splits[i]<boxes[i+4][1]for i in range(4))
cells=[];roots=[];tops=[];floors=[]
for i in range(8):
    x0,x1=round(i%4*w/4),round((i%4+1)*w/4)
    y0,y1=(0,splits[i%4])if i<4 else(splits[i%4],h)
    cells.append([x0,y0,x1,y1]);mask=solid[y0:y1,x0:x1]
    yy,xx=np.where(mask);top,bottom=int(yy.min()),int(yy.max()+1);tops.append(y0+top);floors.append(y0+bottom)
    torso_x=np.where(mask[top+round((bottom-top)*.38):top+round((bottom-top)*.58)])[1]
    roots.append(x0+float(np.median(torso_x)))
height=float(np.median([b-t for b,t in zip(floors,tops)]));row_floor=[float(np.median(floors[:4])),float(np.median(floors[4:]))]
assembly={'version':1,'normalizedHeight':500,'targetBodyHeight':520,'targetAnchor':[320,616],'durationsMs':[125]*8,
    'inputs':[{'id':'filled48','file':'authoring-inputs/strip-filled48.png','sha256':sha(raw),'poseCount':8,
               'cells':cells,'rootXs':roots,'rootYs':[row_floor[i//4]for i in range(8)],'bodyHeights':[height]*8}],
    'poses':[{'input':'filled48','pose':i}for i in range(8)],
    'review':'One shared physical strip height and row registration estimate. Targets/torso estimates are not observed sole or cane material. Candidate only.'}
save(f/'assembly.json',assembly)
subprocess.run(['python3','scripts/assemble-reviewed-motion.py',str(f)],check=True)
settings=json.loads((f/'motion-polish.json').read_text());settings['sourceCells']=[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)];save(f/'motion-polish.json',settings)
entry=next(e for e in json.loads((r/'docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Elder'and e['kind']=='walk'and e['direction']=='right');entry['destination']=str(f.relative_to(r));save(p/'entry-filled48.json',entry)
s=importlib.util.spec_from_file_location('ex',r/'scripts/export-character-motion.py');ex=importlib.util.module_from_spec(s);s.loader.exec_module(ex);ex.export(entry)
print({'sharedRawHeight':height,'rawFloorEstimates':floors,'rawTorsoEstimates':roots,'columnRowGutters':splits,'selected':False})
