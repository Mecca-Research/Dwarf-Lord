"""Visible material and source-only provenance; no motion or pose synthesis."""
import json,hashlib,sys
from pathlib import Path
import cv2,numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
from station_contact import measure
from gait_calibration import binding,digest
p=Path('work/expanded-cycles/motion48/cook-dough');f=Path('public/sprites/Cook/motion/knead-dough/actor');m=json.loads((f/'manifest.json').read_text())
frames=[np.asarray(Image.open(f/f'{i:02}.png').convert('RGBA'),dtype=np.float32)/255 for i in range(8)]
row={'sourceSha256':digest(f/'source-sheet.png'),'binding':binding(f,m),'bounds':{'minCorrelation':.94,'maxDriftPx':6,'maxAdjacentPx':6},'regions':[],'approval':False,'scope':'Visible stationary near cap/rim and exposed far toe material only, all8 source poses at fixed root. No hidden anatomical soles, moving gait or seamless-loop approval.'}
for name,box in [('near',[94,531,173,594]),('far',[351,488,385,528])]:
 x0,y0,x1,y1=box;gray=[cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY)[y0:y1,x0:x1]for a in frames];results=[]
 for i,g in enumerate(gray):
  warp=np.eye(2,3,dtype=np.float32);c,warp=cv2.findTransformECC(gray[0],g,warp,cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_COUNT|cv2.TERM_CRITERIA_EPS,300,1e-7),None,5)
  drift=float(np.linalg.norm(warp[:,2]));results.append({'frame':i,'correlation':c,'translationPx':warp[:,2].tolist(),'driftPx':drift,'passed':c>=.94 and drift<=6})
 changes=[float(np.linalg.norm(np.subtract(results[i]['translationPx'],results[i-1]['translationPx'])))for i in range(1,8)]
 row['regions'].append({'name':name,'box':box,'results':results,'adjacentDriftPx':changes,'passed':all(x['passed']for x in results)and max(changes)<=6})
row['measurementPassed']=all(r['passed']for r in row['regions']);(p/'stationary-boots48.json').write_text(json.dumps(row,indent=2)+'\n')
config={'actor':str(f),'binding':binding(f,m),'dependencies':[{'file':str(q),'sha256':digest(q)}for q in [Path('public/sprites/workstations/dough-block/sprite.png'),Path('public/sprites/Cook/motion/render-calibration.json')]],
 'workingFacePolygon':[[182,321],[463,290],[578,323],[338,375]],'points':[[354,329],[354,329],[354,334],[354,320],[354,317],[354,321],[354,325],[354,329]],
 'scope':'Manually inspected visible lower dough boundary on the independent floured tabletop. Dough deforms; samples are not a rigid tracked material point. No force, hand pressure, baking or 3D ground claim.'}
result=measure(config);(p/'dough-surface-contact48.json').write_text(json.dumps(result,indent=2)+'\n')
identity=[]
for i in range(8):
 src=np.array(Image.open(Path('public/sprites/Cook/motion/knead-dough/reference')/f'{i:02}.png').convert('RGBA'));dst=(frames[i]*255).round().astype(np.uint8);visible=dst[:,:,3]>128
 assert np.array_equal(dst[visible],src[visible]),f'Actor changed original opaque source pixels{i}'
 identity.append({'frame':i,'originalSha256':digest(Path('public/sprites/Cook/motion/knead-dough/reference')/f'{i:02}.png'),'exportedSha256':digest(f/f'{i:02}.png'),'visiblePixels':int(visible.sum()),'sameOpaqueOriginalPixels':True})
(p/'source-pixel-identity48.json').write_text(json.dumps({'samples':identity,'geometryEdited':False,'originalFrameOrder':m['sourceFrameOrder'],'scope':'Literal source-material at original exported coordinates; masks do not move, recolor or synthesize any opaque actor pixel.'},indent=2)+'\n')
print({'bootsPassed':row['measurementPassed'],'regions':[(r['name'],min(v['correlation']for v in r['results']),max(v['driftPx']for v in r['results']),max(r['adjacentDriftPx']))for r in row['regions']],'maxDoughOutsideFacePx':result['maxOutsideWorkingFacePx'],'identityExact':len(identity)})
